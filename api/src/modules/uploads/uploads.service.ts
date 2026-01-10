import {
  Injectable,
  BadRequestException,
  Inject,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { execFile } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import { createUploadStream, fileExists, getFileSize } from '../../libs/local-storage';

const execFileAsync = util.promisify(execFile);

/**
 * Uploads Service
 * Handles video file uploads with validation, transcoding job creation, and Redis queue management
 * Security features:
 * 1. Validates file types using libmagic
 * 2. Tracks upload metrics per user
 * 3. Only admins can upload
 * 4. Enqueues transcoding jobs for background processing
 */
@Injectable()
export class UploadsService {
  private redis: Redis;
  private readonly ALLOWED_MIME_TYPES = [
    'video/mp4',
    'video/x-matroska',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'video/MP2T',
    'video/x-flv',
  ];
  private readonly MAX_FILE_SIZE = 100 * 1024 * 1024 * 1024; // 100GB

  constructor(@Inject('PRISMA') private prisma: PrismaClient) {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  /**
   * Initialize a single file upload
   * Returns upload URL for client to PUT file to
   */
  async initUpload(userId: string | undefined, dto: any) {
    // Verify user is admin (only admins can upload)
    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !['admin', 'main_admin'].includes(user.role)) {
      throw new ForbiddenException('Only admins can upload videos');
    }

    // Validate request
    if (!dto.filename || dto.filename.length === 0) {
      throw new BadRequestException('Filename is required');
    }

    if (!Number.isInteger(dto.size) || dto.size <= 0) {
      throw new BadRequestException('File size must be a positive integer');
    }

    if (dto.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException('File exceeds maximum size of 100GB');
    }

    // Generate upload ID
    const uploadId = uuidv4();
    const key = `uploads/${uploadId}/${dto.filename}`;

    // Record upload metric
    try {
      await this.prisma.uploadMetric.create({
        data: {
          userId,
          bytesUploaded: BigInt(dto.size),
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to record upload metric');
    }

    // Create transcoding job record
    try {
      await this.prisma.transcodingJob.create({
        data: {
          id: uploadId,
          status: 'pending',
          createdById: userId,
          presetInfo: {
            prefer_downscale_to_1080: dto.prefer_downscale_to_1080 ?? true,
            keep_original: dto.keep_original ?? false,
            filename: dto.filename,
            originalSize: dto.size,
          },
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to create transcoding job');
    }

    return {
      success: true,
      uploadId,
      uploadUrl: `/api/upload/${uploadId}/stream`,
      key,
    };
  }

  /**
   * Initialize batch upload (multiple files)
   * Returns array of upload URLs for each file
   */
  async initBatch(userId: string | undefined, dtos: any[]) {
    // Verify user is admin
    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !['admin', 'main_admin'].includes(user.role)) {
      throw new ForbiddenException('Only admins can upload videos');
    }

    // Validate batch
    if (!Array.isArray(dtos) || dtos.length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    if (dtos.length > 100) {
      throw new BadRequestException('Batch cannot exceed 100 files');
    }

    const batchId = uuidv4();
    const results = [];

    for (const dto of dtos) {
      // Validate each file
      if (!dto.filename || dto.filename.length === 0) {
        throw new BadRequestException('All files must have a filename');
      }

      if (!Number.isInteger(dto.size) || dto.size <= 0) {
        throw new BadRequestException('All files must have a valid size');
      }

      if (dto.size > this.MAX_FILE_SIZE) {
        throw new BadRequestException('One or more files exceed maximum size');
      }

      // Create upload record
      const uploadId = uuidv4();
      const key = `uploads/${batchId}/${uploadId}/${dto.filename}`;

      try {
        await this.prisma.transcodingJob.create({
          data: {
            id: uploadId,
            status: 'pending',
            createdById: userId,
            presetInfo: {
              prefer_downscale_to_1080: dto.prefer_downscale_to_1080 ?? true,
              keep_original: dto.keep_original ?? false,
              batchId,
              filename: dto.filename,
              originalSize: dto.size,
            },
          },
        });

        results.push({
          uploadId,
          uploadUrl: `/api/upload/${uploadId}/stream`,
          key,
        });
      } catch (error) {
        throw new InternalServerErrorException(
          'Failed to create transcoding job'
        );
      }
    }

    // Record batch upload metrics
    const totalSize = BigInt(dtos.reduce((sum, d) => sum + d.size, 0));
    try {
      await this.prisma.uploadMetric.create({
        data: {
          userId,
          bytesUploaded: totalSize,
        },
      });
    } catch (error) {
      // Non-critical, continue
    }

    return {
      success: true,
      batchId,
      files: results,
    };
  }

  /**
   * Complete upload and enqueue for transcoding
   * Validates file type and moves to transcoding queue
   */
  async completeUpload(
    userId: string | undefined,
    uploadId: string,
    metadata?: any
  ) {
    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    // Find transcoding job
    const job = await this.prisma.transcodingJob.findUnique({
      where: { id: uploadId },
    });

    if (!job) {
      throw new NotFoundException('Upload job not found');
    }

    // Verify uploader matches current user or user is admin
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (
      job.createdById !== userId &&
      (!user || !['admin', 'main_admin'].includes(user.role))
    ) {
      throw new ForbiddenException('Cannot complete another users upload');
    }

    // Find uploaded file in storage
    const uploadBasePath = process.env.STORAGE_PATH || '/opt/strelitzia/storage';
    const uploadsPath = path.join(uploadBasePath, 'uploads');
    const uploadDir = path.join(uploadsPath, uploadId);

    if (!fs.existsSync(uploadDir)) {
      throw new BadRequestException('Upload directory not found in storage');
    }

    const files = fs.readdirSync(uploadDir);
    if (files.length === 0) {
      throw new BadRequestException('No file found in upload directory');
    }

    const filename = files[0];
    const filePath = path.join(uploadDir, filename);
    const uploadedKey = `uploads/${uploadId}/${filename}`;

    // Validate file type using libmagic
    let mimeType: string;
    try {
      const { stdout } = await execFileAsync('file', [
        '--mime-type',
        '-b',
        filePath,
      ]);
      mimeType = stdout.trim();
    } catch (error) {
      // Clean up on error
      try {
        fs.unlinkSync(filePath);
      } catch {}
      throw new BadRequestException('Failed to validate file type');
    }

    // Check mime type
    if (!this.ALLOWED_MIME_TYPES.includes(mimeType)) {
      // Clean up on error
      try {
        fs.unlinkSync(filePath);
      } catch {}
      throw new BadRequestException(
        `File type not allowed. Got: ${mimeType}`
      );
    }

    // Update job with file info
    try {
      await this.prisma.transcodingJob.update({
        where: { id: uploadId },
        data: {
          status: 'pending',
          presetInfo: {
            ...(job.presetInfo as any),
            ...metadata,
            mimeType,
            uploadedFilename: filename,
          },
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to update transcoding job');
    }

    // Enqueue for transcoding
    try {
      await this.redis.lpush(
        'transcoding:queue',
        JSON.stringify({
          uploadId,
          key: uploadedKey,
          filePath,
          userId,
          presetInfo: {
            ...(job.presetInfo as any),
            ...metadata,
            mimeType,
          },
        })
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to enqueue transcoding job'
      );
    }

    // Log upload completion
    try {
      await this.prisma.auditLog.create({
        data: {
          action: 'file_uploaded',
          actorId: userId,
          detailsJson: {
            uploadId,
            filename,
            size: BigInt(fs.statSync(filePath).size).toString(),
          },
        },
      });
    } catch (error) {
      // Non-critical, continue
    }

    return {
      success: true,
      jobId: uploadId,
      message: 'File uploaded and queued for transcoding',
    };
  }

  /**
   * Get upload status
   */
  async getUploadStatus(uploadId: string) {
    const job = await this.prisma.transcodingJob.findUnique({
      where: { id: uploadId },
      select: {
        id: true,
        status: true,
        createdAt: true,
        startedAt: true,
        finishedAt: true,
      },
    });

    if (!job) {
      throw new NotFoundException('Upload job not found');
    }

    return {
      success: true,
      data: job,
    };
  }
}