import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Videos Service
 * Handles video/episode management, streaming, and watch history
 * Security features:
 * 1. Directory traversal protection for segment serving
 * 2. Only admins can create/delete videos
 * 3. Watch history only records authenticated users
 * 4. NSFW flag support for content filtering
 */
@Injectable()
export class VideosService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  /**
   * Get signed master URL for video playback
   * Returns local API endpoint for offline mode
   */
  async getSignedMasterUrl(episodeId: string) {
    const episode = await this.prisma.episode.findUnique({
      where: { id: episodeId },
    });

    if (!episode || (!episode.filesystem_path && !episode.s3_master_key)) {
      throw new NotFoundException('Episode not found');
    }

    // Prefer filesystem_path for local storage, fall back to s3_master_key
    return `/api/videos/${episodeId}/stream`;
  }

  /**
   * Get file path for direct filesystem access (used internally)
   */
  async getFilePathForEpisode(episodeId: string): Promise<string | null> {
    const episode = await this.prisma.episode.findUnique({
      where: { id: episodeId },
    });

    if (!episode) return null;

    // Prefer filesystem_path for local storage
    if (episode.filesystem_path) {
      const storagePath = process.env.STORAGE_PATH || '/opt/strelitzia/storage';
      return path.join(storagePath, episode.filesystem_path);
    }

    // Fallback to S3 key (for backward compatibility, though S3 is deprecated)
    if (episode.s3_master_key) {
      const storagePath = process.env.STORAGE_PATH || '/opt/strelitzia/storage';
      return path.join(storagePath, 'videos', episode.s3_master_key);
    }

    return null;
  }

  /**
   * Check if episode file exists
   */
  async episodeFileExists(episodeId: string): Promise<boolean> {
    const filePath = await this.getFilePathForEpisode(episodeId);
    if (!filePath) return false;
    return fs.existsSync(filePath);
  }

  /**
   * Get file stream for serving (used by stream endpoint)
   */
  async getStreamForEpisode(episodeId: string) {
    const episode = await this.prisma.episode.findUnique({
      where: { id: episodeId },
    });

    if (!episode) return null;

    const filePath = await this.getFilePathForEpisode(episodeId);
    if (!filePath || !fs.existsSync(filePath)) return null;

    const stats = fs.statSync(filePath);
    return {
      stream: fs.createReadStream(filePath),
      size: stats.size,
      mimeType: 'application/x-mpegURL',
    };
  }

  /**
   * Get segment stream for HLS playback with directory traversal protection
   */
  async getSegmentStream(episodeId: string, segmentName: string) {
    // Prevent directory traversal attacks
    if (
      segmentName.includes('..') ||
      segmentName.includes('/') ||
      segmentName.includes('\\')
    ) {
      return null;
    }

    const episode = await this.prisma.episode.findUnique({
      where: { id: episodeId },
    });

    if (!episode) return null;

    const basePath = await this.getFilePathForEpisode(episodeId);
    if (!basePath) return null;

    const segmentDir = path.dirname(basePath);
    const segmentPath = path.join(segmentDir, segmentName);

    // Ensure segment is within episode directory (prevent directory traversal)
    const normalizedSegmentPath = path.normalize(segmentPath);
    const normalizedDir = path.normalize(segmentDir);
    if (!normalizedSegmentPath.startsWith(normalizedDir)) {
      return null;
    }

    if (!fs.existsSync(segmentPath)) {
      return null;
    }

    const stats = fs.statSync(segmentPath);
    return {
      stream: fs.createReadStream(segmentPath),
      size: stats.size,
      mimeType: 'video/MP2T',
    };
  }

  /**
   * Create a new video (admin only)
   */
  async createVideo(
    requestingUserId: string,
    title: string,
    description?: string,
    nsfw: boolean = false
  ) {
    // Verify user is admin
    const user = await this.prisma.user.findUnique({
      where: { id: requestingUserId },
    });

    if (!user || (user.role !== 'admin' && user.role !== 'main_admin')) {
      throw new ForbiddenException('Only admins can create videos');
    }

    // Validate input
    if (!title || title.length === 0) {
      throw new BadRequestException('Title is required');
    }

    if (title.length > 255) {
      throw new BadRequestException('Title must be less than 255 characters');
    }

    try {
      const video = await this.prisma.video.create({
        data: {
          title,
          description: description || null,
          nsfw,
          createdById: requestingUserId,
        },
        include: {
          episodes: true,
          createdBy: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      // Log video creation
      await this.prisma.auditLog.create({
        data: {
          action: 'video_created',
          actorId: requestingUserId,
          targetId: video.id,
          detailsJson: {
            title,
            nsfw,
          },
        },
      });

      return {
        success: true,
        data: video,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to create video');
    }
  }

  /**
   * Get video by ID
   */
  async getVideoById(videoId: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      include: {
        episodes: {
          select: {
            id: true,
            title: true,
            seriesTitle: true,
            season: true,
            episodeNumber: true,
            runtimeSec: true,
            createdAt: true,
          },
          orderBy: [{ season: 'asc' }, { episodeNumber: 'asc' }],
        },
        createdBy: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    return {
      success: true,
      data: video,
    };
  }

  /**
   * Get all episodes for a video
   */
  async getEpisodesByVideoId(videoId: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    const episodes = await this.prisma.episode.findMany({
      where: { videoId },
      select: {
        id: true,
        title: true,
        seriesTitle: true,
        season: true,
        episodeNumber: true,
        runtimeSec: true,
        createdAt: true,
      },
      orderBy: [{ season: 'asc' }, { episodeNumber: 'asc' }],
    });

    return {
      success: true,
      data: episodes,
    };
  }

  /**
   * Get all episodes (optionally filter by NSFW)
   */
  async getAllEpisodes(includeNsfw: boolean = false) {
    const episodes = await this.prisma.episode.findMany({
      include: {
        video: {
          select: {
            id: true,
            title: true,
            nsfw: true,
          },
        },
      },
      where: includeNsfw
        ? undefined
        : {
            video: {
              nsfw: false,
            },
          },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: episodes,
    };
  }

  /**
   * Delete video (admin only)
   */
  async deleteVideo(requestingUserId: string, videoId: string) {
    // Verify user is admin
    const user = await this.prisma.user.findUnique({
      where: { id: requestingUserId },
    });

    if (!user || (user.role !== 'admin' && user.role !== 'main_admin')) {
      throw new ForbiddenException('Only admins can delete videos');
    }

    // Find video
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      include: {
        episodes: true,
      },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    // Delete all episodes and their files
    for (const episode of video.episodes) {
      const filePath = await this.getFilePathForEpisode(episode.id);
      if (filePath && fs.existsSync(filePath)) {
        try {
          // Delete HLS directory
          const dir = path.dirname(filePath);
          fs.rmSync(dir, { recursive: true, force: true });
        } catch (error) {
          // Log error but continue
        }
      }
    }

    // Delete video from database (cascades to episodes)
    try {
      await this.prisma.video.delete({
        where: { id: videoId },
      });

      // Log video deletion
      await this.prisma.auditLog.create({
        data: {
          action: 'video_deleted',
          actorId: requestingUserId,
          targetId: videoId,
          detailsJson: {
            title: video.title,
            episodeCount: video.episodes.length,
          },
        },
      });

      return {
        success: true,
        message: 'Video deleted successfully',
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete video');
    }
  }

  /**
   * Record watch history for user
   */
  async recordWatchHistory(
    userId: string,
    episodeId: string,
    positionSec: number
  ) {
    // Validate input
    if (!Number.isInteger(positionSec) || positionSec < 0) {
      throw new BadRequestException('Position must be a non-negative integer');
    }

    // Find episode
    const episode = await this.prisma.episode.findUnique({
      where: { id: episodeId },
    });

    if (!episode) {
      throw new NotFoundException('Episode not found');
    }

    try {
      // Upsert watch history
      const watchHistory = await this.prisma.watchHistory.upsert({
        where: {
          userId_episodeId: {
            userId,
            episodeId,
          },
        },
        create: {
          userId,
          episodeId,
          lastPositionSec: positionSec,
        },
        update: {
          lastPositionSec: positionSec,
          watchedAt: new Date(),
        },
      });

      return {
        success: true,
        data: watchHistory,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to record watch history'
      );
    }
  }

  /**
   * Get watch history for user
   */
  async getWatchHistory(userId: string) {
    const history = await this.prisma.watchHistory.findMany({
      where: { userId },
      include: {
        episode: {
          include: {
            video: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        watchedAt: 'desc',
      },
    });

    return {
      success: true,
      data: history,
    };
  }
}