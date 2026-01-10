import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TranscodingService } from './transcoding.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

/**
 * Transcoding Controller - REST API for video transcoding management
 * 
 * Endpoints for:
 * - Enqueueing videos for HLS transcoding
 * - Monitoring transcoding job progress
 * - Viewing transcoding logs
 * - Managing transcoding jobs (cancel, retry)
 * - System statistics
 */
@Controller('api/transcoding')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TranscodingController {
  constructor(private transcodingService: TranscodingService) {}

  /**
   * Enqueue a video episode for HLS transcoding
   * 
   * POST /api/transcoding/enqueue
   * 
   * Admin/MainAdmin only
   */
  @Post('enqueue')
  @Roles('admin', 'main_admin')
  async enqueueTranscoding(
    @CurrentUser() user: User,
    @Query('episodeId') episodeId: string,
    @Query('uploadId') uploadId: string,
  ) {
    if (!episodeId || !uploadId) {
      throw new BadRequestException('episodeId and uploadId query parameters required');
    }

    const job = await this.transcodingService.enqueueTranscoding(
      user.id,
      episodeId,
      uploadId,
    );

    return {
      success: true,
      jobId: job.id,
      episodeId: job.episodeId,
      status: job.status,
      createdAt: job.createdAt,
    };
  }

  /**
   * List transcoding jobs with optional filtering
   * 
   * GET /api/transcoding/jobs
   * Query: ?status=pending|running|success|failed&episodeId=<id>&limit=50&offset=0
   */
  @Get('jobs')
  @Roles('admin', 'main_admin')
  async listJobs(
    @Query('status') status?: string,
    @Query('episodeId') episodeId?: string,
    @Query('limit') limit: string = '50',
    @Query('offset') offset: string = '0',
  ) {
    const filters: any = {};

    if (status && ['pending', 'running', 'success', 'failed', 'cancelled'].includes(status)) {
      filters.status = status;
    }
    if (episodeId) {
      filters.episodeId = episodeId;
    }

    const jobs = await this.transcodingService.listJobs(
      filters,
      Math.min(parseInt(limit) || 50, 500), // Max 500
      Math.max(parseInt(offset) || 0, 0),
    );

    return {
      success: true,
      count: jobs.length,
      jobs: jobs.map((job) => ({
        id: job.id,
        episodeId: job.episodeId,
        episodeTitle: job.episode?.title,
        videoTitle: job.episode?.video?.title,
        status: job.status,
        startedAt: job.startedAt,
        finishedAt: job.finishedAt,
        createdAt: job.createdAt,
      })),
    };
  }

  /**
   * Get specific transcoding job details
   * 
   * GET /api/transcoding/jobs/:jobId
   */
  @Get('jobs/:jobId')
  @Roles('admin', 'main_admin')
  async getJob(@Param('jobId') jobId: string) {
    const job = await this.transcodingService.getJob(jobId);

    return {
      success: true,
      job: {
        id: job.id,
        episodeId: job.episodeId,
        episodeTitle: job.episode?.title,
        videoTitle: job.episode?.video?.title,
        status: job.status,
        presetInfo: job.presetInfo,
        startedAt: job.startedAt,
        finishedAt: job.finishedAt,
        createdAt: job.createdAt,
        hasLogs: !!job.logsText,
      },
    };
  }

  /**
   * Get transcoding job logs for debugging
   * 
   * GET /api/transcoding/jobs/:jobId/logs
   */
  @Get('jobs/:jobId/logs')
  @Roles('admin', 'main_admin')
  async getJobLogs(@Param('jobId') jobId: string) {
    const logs = await this.transcodingService.getJobLogs(jobId);

    return {
      success: true,
      jobId,
      logs,
    };
  }

  /**
   * Cancel a pending or running transcoding job
   * 
   * POST /api/transcoding/jobs/:jobId/cancel
   * 
   * Admin/MainAdmin only, cannot cancel completed jobs
   */
  @Post('jobs/:jobId/cancel')
  @Roles('admin', 'main_admin')
  async cancelJob(
    @CurrentUser() user: User,
    @Param('jobId') jobId: string,
  ) {
    const cancelled = await this.transcodingService.cancelJob(user.id, jobId);

    return {
      success: true,
      jobId: cancelled.id,
      status: cancelled.status,
      finishedAt: cancelled.finishedAt,
    };
  }

  /**
   * Retry a failed or cancelled transcoding job
   * 
   * POST /api/transcoding/jobs/:jobId/retry
   * Query: ?uploadId=<optional-new-upload-id>
   * 
   * Creates a new job with the same episode
   */
  @Post('jobs/:jobId/retry')
  @Roles('admin', 'main_admin')
  async retryJob(
    @CurrentUser() user: User,
    @Param('jobId') jobId: string,
    @Query('uploadId') uploadId?: string,
  ) {
    const newJob = await this.transcodingService.retryJob(user.id, jobId, uploadId);

    return {
      success: true,
      originalJobId: jobId,
      newJobId: newJob.id,
      status: newJob.status,
      createdAt: newJob.createdAt,
    };
  }

  /**
   * Get transcoding system statistics
   * 
   * GET /api/transcoding/stats
   */
  @Get('stats')
  @Roles('admin', 'main_admin')
  async getStatistics() {
    const stats = await this.transcodingService.getStatistics();

    return {
      success: true,
      stats: {
        totalJobs: stats.totalJobs,
        pending: stats.statusCounts.pending,
        running: stats.statusCounts.running,
        success: stats.statusCounts.success,
        failed: stats.statusCounts.failed,
        cancelled: stats.statusCounts.cancelled,
        averageDurationSeconds: Math.round(stats.averageDurationMs / 1000),
        successRatePercent: stats.successRate.toFixed(2),
      },
    };
  }
}