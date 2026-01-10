import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  NotFoundException,
  Res,
  UseGuards,
  Req,
} from '@nestjs/common';
import { VideosService } from './videos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Response } from 'express';

/**
 * Videos Controller
 * Endpoints for video browsing, streaming, and watch history
 * Public endpoints: browse, stream
 * Protected endpoints: watch history, CRUD (admin only)
 */
@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  /**
   * Create new video (admin only)
   * POST /videos
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'main_admin')
  async createVideo(
    @Body() body: { title: string; description?: string; nsfw?: boolean },
    @Req() req: any
  ) {
    return this.videosService.createVideo(
      req.user?.id,
      body.title,
      body.description,
      body.nsfw ?? false
    );
  }

  /**
   * Get video by ID with episodes
   * GET /videos/:videoId
   */
  @Get(':videoId')
  async getVideo(@Param('videoId') videoId: string) {
    return this.videosService.getVideoById(videoId);
  }

  /**
   * Get all episodes for a video
   * GET /videos/:videoId/episodes
   */
  @Get(':videoId/episodes')
  async getEpisodes(@Param('videoId') videoId: string) {
    return this.videosService.getEpisodesByVideoId(videoId);
  }

  /**
   * Get signed URL for video playback
   * Returns local API endpoint for offline mode
   * GET /videos/:episodeId/signed-url
   */
  @Get(':episodeId/signed-url')
  async getSignedUrl(@Param('episodeId') episodeId: string) {
    const url = await this.videosService.getSignedMasterUrl(episodeId);
    if (!url) throw new NotFoundException('Episode or master playlist not found');
    return { success: true, url };
  }

  /**
   * Delete video (admin only)
   * DELETE /videos/:videoId
   */
  @Delete(':videoId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'main_admin')
  async deleteVideo(
    @Param('videoId') videoId: string,
    @Req() req: any
  ) {
    return this.videosService.deleteVideo(req.user?.id, videoId);
  }

  /**
   * Record watch history
   * POST /videos/:episodeId/watch
   */
  @Post(':episodeId/watch')
  @UseGuards(JwtAuthGuard)
  async recordWatch(
    @Param('episodeId') episodeId: string,
    @Body() body: { positionSec: number },
    @Req() req: any
  ) {
    return this.videosService.recordWatchHistory(
      req.user?.id,
      episodeId,
      body.positionSec
    );
  }

  /**
   * Get watch history for current user
   * GET /videos/watch-history/me
   */
  @Get('watch-history/me')
  @UseGuards(JwtAuthGuard)
  async getWatchHistory(@Req() req: any) {
    return this.videosService.getWatchHistory(req.user?.id);
  }

  /**
   * Stream video file (HLS master playlist or segments)
   * Replaces S3 presigned GET URLs
   * GET /videos/:episodeId/stream
   */
  @Get(':episodeId/stream')
  async streamVideo(
    @Param('episodeId') episodeId: string,
    @Res() res: Response
  ) {
    try {
      const fileData = await this.videosService.getStreamForEpisode(episodeId);
      if (!fileData) {
        return res.status(404).json({ error: 'Video not found' });
      }

      res.setHeader('Content-Type', fileData.mimeType);
      res.setHeader('Content-Length', fileData.size);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('Accept-Ranges', 'bytes');

      fileData.stream.pipe(res);
    } catch (error) {
      res.status(500).json({
        error: 'Stream error',
        message: (error as any).message,
      });
    }
  }

  /**
   * Stream HLS segment file
   * GET /videos/:episodeId/segment/:segmentName
   */
  @Get(':episodeId/segment/:segmentName')
  async streamSegment(
    @Param('episodeId') episodeId: string,
    @Param('segmentName') segmentName: string,
    @Res() res: Response
  ) {
    try {
      const fileData = await this.videosService.getSegmentStream(
        episodeId,
        segmentName
      );
      if (!fileData) {
        return res.status(404).json({ error: 'Segment not found' });
      }

      res.setHeader('Content-Type', 'video/MP2T');
      res.setHeader('Content-Length', fileData.size);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

      fileData.stream.pipe(res);
    } catch (error) {
      res.status(500).json({
        error: 'Stream error',
        message: (error as any).message,
      });
    }
  }
}