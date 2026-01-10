import { Injectable, Inject, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaClient, TranscodingStatus } from '@prisma/client';
import Redis from 'ioredis';

/**
 * Transcoding Service - Manages HLS video transcoding jobs
 * 
 * Responsibilities:
 * - Enqueue video files for HLS transcoding
 * - Monitor transcoding job progress and status
 * - Manage transcoding presets and configurations
 * - Retrieve transcoding logs and results
 * - Support job retry and cancellation
 * - Audit logging for all transcoding operations
 */
@Injectable()
export class TranscodingService {
  private redis: Redis;

  constructor(@Inject('PRISMA') private prisma: PrismaClient) {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  /**
   * Enqueue a video episode for HLS transcoding
   * Only admins can initiate transcoding
   * 
   * @param userId - User requesting transcoding (must be admin)
   * @param episodeId - Episode to transcode
   * @param uploadId - Upload containing the video file
   * @returns TranscodingJob with pending status
   */
  async enqueueTranscoding(
    userId: string,
    episodeId: string,
    uploadId: string,
  ): Promise<any> {
    // Verify user is admin
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role !== 'admin' && user.role !== 'main_admin') {
      throw new ForbiddenException('Only admins can enqueue transcoding jobs');
    }

    // Verify episode exists
    const episode = await this.prisma.episode.findUnique({
      where: { id: episodeId },
      include: { video: true },
    });
    if (!episode) {
      throw new NotFoundException('Episode not found');
    }

    // Verify upload exists and is completed
    const upload = await this.prisma.upload.findUnique({
      where: { id: uploadId },
    });
    if (!upload) {
      throw new NotFoundException('Upload not found');
    }
    if (upload.status !== 'completed') {
      throw new BadRequestException('Upload must be completed before transcoding');
    }

    // Check if job already exists for this episode
    const existingJob = await this.prisma.transcodingJob.findFirst({
      where: {
        episodeId,
        status: { in: ['pending', 'running'] },
      },
    });
    if (existingJob) {
      throw new BadRequestException(`Episode already has a pending/running transcoding job: ${existingJob.id}`);
    }

    // Create transcoding job
    const job = await this.prisma.transcodingJob.create({
      data: {
        episodeId,
        status: 'pending',
        createdById: userId,
        presetInfo: {
          uploadId,
          videoTitle: episode.title || episode.video?.title,
          createdAt: new Date().toISOString(),
        },
      },
    });

    // Enqueue job to Redis
    const jobPayload = {
      jobId: job.id,
      episodeId,
      uploadId,
    };
    await this.redis.lpush('transcoding:queue', JSON.stringify(jobPayload));

    // Log to audit log
    await this.prisma.auditLog.create({
      data: {
        actorId: userId,
        targetId: episodeId,
        action: 'TRANSCODE_ENQUEUE',
        detailsJson: {
          jobId: job.id,
          uploadId,
          episodeTitle: episode.title,
          videoTitle: episode.video?.title,
        },
      },
    });

    return job;
  }

  /**
   * Get transcoding job details
   * 
   * @param jobId - Job ID
   * @returns TranscodingJob with status, logs, and metadata
   */
  async getJob(jobId: string): Promise<any> {
    const job = await this.prisma.transcodingJob.findUnique({
      where: { id: jobId },
      include: {
        episode: {
          include: { video: true },
        },
      },
    });

    if (!job) {
      throw new NotFoundException(`Transcoding job not found: ${jobId}`);
    }

    return job;
  }

  /**
   * List all transcoding jobs with optional filtering
   * 
   * @param filters - Filter by status, episode, user, date range
   * @param limit - Maximum results (default: 50)
   * @param offset - Pagination offset (default: 0)
   * @returns Array of transcoding jobs
   */
  async listJobs(
    filters?: {
      status?: TranscodingStatus;
      episodeId?: string;
      createdById?: string;
      fromDate?: Date;
      toDate?: Date;
    },
    limit: number = 50,
    offset: number = 0,
  ): Promise<any[]> {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.episodeId) {
      where.episodeId = filters.episodeId;
    }
    if (filters?.createdById) {
      where.createdById = filters.createdById;
    }
    if (filters?.fromDate || filters?.toDate) {
      where.createdAt = {};
      if (filters.fromDate) {
        where.createdAt.gte = filters.fromDate;
      }
      if (filters.toDate) {
        where.createdAt.lte = filters.toDate;
      }
    }

    return this.prisma.transcodingJob.findMany({
      where,
      include: {
        episode: {
          include: { video: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get job logs for debugging and monitoring
   * 
   * @param jobId - Job ID
   * @returns Job logs as plain text
   */
  async getJobLogs(jobId: string): Promise<string> {
    const job = await this.getJob(jobId);

    if (!job.logsText) {
      return `No logs available for job ${jobId}`;
    }

    return job.logsText;
  }

  /**
   * Cancel a pending transcoding job
   * Only admins and job creator can cancel
   * 
   * @param userId - User requesting cancellation
   * @param jobId - Job ID to cancel
   * @returns Cancelled job
   */
  async cancelJob(userId: string, jobId: string): Promise<any> {
    // Verify user is admin
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role !== 'admin' && user.role !== 'main_admin') {
      throw new ForbiddenException('Only admins can cancel transcoding jobs');
    }

    // Get job
    const job = await this.getJob(jobId);

    // Only allow cancelling pending or running jobs
    if (job.status === 'success' || job.status === 'failed' || job.status === 'cancelled') {
      throw new BadRequestException(
        `Cannot cancel job with status: ${job.status}`,
      );
    }

    // Update job status
    const cancelled = await this.prisma.transcodingJob.update({
      where: { id: jobId },
      data: {
        status: 'cancelled',
        finishedAt: new Date(),
      },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        actorId: userId,
        targetId: jobId,
        action: 'TRANSCODE_CANCEL',
        detailsJson: {
          jobId,
          previousStatus: job.status,
        },
      },
    });

    return cancelled;
  }

  /**
   * Retry a failed transcoding job
   * Creates new job with same episode
   * 
   * @param userId - User requesting retry
   * @param jobId - Failed job ID to retry
   * @param uploadId - Upload file to use (can override)
   * @returns New transcoding job
   */
  async retryJob(
    userId: string,
    jobId: string,
    uploadId?: string,
  ): Promise<any> {
    // Verify user is admin
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role !== 'admin' && user.role !== 'main_admin') {
      throw new ForbiddenException('Only admins can retry transcoding jobs');
    }

    // Get original job
    const originalJob = await this.getJob(jobId);

    if (originalJob.status !== 'failed' && originalJob.status !== 'cancelled') {
      throw new BadRequestException(
        `Can only retry failed or cancelled jobs, current status: ${originalJob.status}`,
      );
    }

    // Use provided upload or extract from original job
    const targetUploadId = uploadId || originalJob.presetInfo?.uploadId;
    if (!targetUploadId) {
      throw new BadRequestException('Upload ID required to retry job');
    }

    // Enqueue new job with same episode
    const newJob = await this.enqueueTranscoding(userId, originalJob.episodeId, targetUploadId);

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        actorId: userId,
        targetId: originalJob.episodeId,
        action: 'TRANSCODE_RETRY',
        detailsJson: {
          originalJobId: jobId,
          newJobId: newJob.id,
          previousStatus: originalJob.status,
        },
      },
    });

    return newJob;
  }

  /**
   * Get transcoding statistics and metrics
   * 
   * @returns Statistics object with job counts by status, average duration, etc.
   */
  async getStatistics(): Promise<any> {
    const totalJobs = await this.prisma.transcodingJob.count();
    
    const jobsByStatus = await this.prisma.transcodingJob.groupBy({
      by: ['status'],
      _count: true,
    });

    const statusCounts = {
      pending: 0,
      running: 0,
      success: 0,
      failed: 0,
      cancelled: 0,
    };

    jobsByStatus.forEach((group) => {
      statusCounts[group.status as keyof typeof statusCounts] = group._count;
    });

    // Get average job duration (for completed jobs)
    const completedJobs = await this.prisma.transcodingJob.findMany({
      where: {
        status: { in: ['success', 'failed'] },
        startedAt: { not: null },
        finishedAt: { not: null },
      },
      select: {
        startedAt: true,
        finishedAt: true,
      },
    });

    let averageDurationMs = 0;
    if (completedJobs.length > 0) {
      const totalDuration = completedJobs.reduce((sum, job) => {
        const duration = new Date(job.finishedAt).getTime() - new Date(job.startedAt).getTime();
        return sum + duration;
      }, 0);
      averageDurationMs = totalDuration / completedJobs.length;
    }

    return {
      totalJobs,
      statusCounts,
      averageDurationMs,
      successRate:
        statusCounts.success > 0
          ? (statusCounts.success / (statusCounts.success + statusCounts.failed)) * 100
          : 0,
    };
  }

  /**
   * Clean up old transcoding logs (maintenance task)
   * Delete logs for jobs older than specified days
   * 
   * @param daysOld - Delete jobs older than this many days
   * @returns Number of jobs cleaned
   */
  async cleanupOldLogs(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.transcodingJob.updateMany({
      where: {
        createdAt: { lt: cutoffDate },
        logsText: { not: null },
      },
      data: {
        logsText: null,
      },
    });

    return result.count;
  }
  // Retry/cancel APIs would enqueue commands to Redis and update DB
}