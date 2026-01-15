import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { VideoSourcesService } from './video-sources.service';
import { MainAdminGuard } from '@/common/guards/main-admin.guard';

@Controller('admin/video-sources')
@UseGuards(MainAdminGuard)
export class VideoSourcesController {
  constructor(private videoSourcesService: VideoSourcesService) {}

  /**
   * Get all configured video sources
   */
  @Get()
  async getAllSources() {
    const sources = await this.videoSourcesService.getAllSources();
    const hasConfigured = sources.length > 0;

    return {
      success: true,
      hasConfiguredSources: hasConfigured,
      sources,
      message: hasConfigured ? 'Video sources configured' : 'No video sources configured',
    };
  }

  /**
   * Get only active video sources
   */
  @Get('active')
  async getActiveSources() {
    const sources = await this.videoSourcesService.getActiveSources();

    return {
      success: true,
      count: sources.length,
      sources,
    };
  }

  /**
   * Get a specific video source by ID
   */
  @Get(':id')
  async getSourceById(@Param('id') id: string) {
    const source = await this.videoSourcesService.getSourceById(id);

    if (!source) {
      throw new NotFoundException('Video source not found');
    }

    return {
      success: true,
      source,
    };
  }

  /**
   * Add a new video source
   * Body: { name: string, path: string, type?: 'local' | 'network', priority?: number }
   */
  @Post()
  async addSource(
    @Body()
    body: {
      name: string;
      path: string;
      type?: 'local' | 'network';
      priority?: number;
    },
  ) {
    if (!body.name || !body.path) {
      throw new BadRequestException('Name and path are required');
    }

    try {
      const source = await this.videoSourcesService.addSource(
        body.name,
        body.path,
        body.type || 'local',
        body.priority || 0,
      );

      return {
        success: true,
        message: 'Video source added successfully',
        source,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Test directory access before adding
   */
  @Post('test-directory')
  async testDirectoryAccess(@Body() body: { path: string }) {
    if (!body.path) {
      throw new BadRequestException('Path is required');
    }

    const result = await this.videoSourcesService.testDirectoryAccess(body.path);

    return {
      success: result.accessible,
      accessible: result.accessible,
      message: result.error || 'Directory is accessible',
      videoCount: result.videoCount,
    };
  }

  /**
   * Update a video source
   */
  @Put(':id')
  async updateSource(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      path?: string;
      isActive?: boolean;
      priority?: number;
    },
  ) {
    try {
      const source = await this.videoSourcesService.updateSource(id, body);

      if (!source) {
        throw new NotFoundException('Video source not found');
      }

      return {
        success: true,
        message: 'Video source updated successfully',
        source,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Delete a video source
   */
  @Delete(':id')
  async deleteSource(@Param('id') id: string) {
    try {
      const success = await this.videoSourcesService.deleteSource(id);

      return {
        success,
        message: 'Video source deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Reorder video sources by priority
   */
  @Put('reorder/all')
  async reorderSources(
    @Body()
    body: Array<{ id: string; priority: number }>,
  ) {
    if (!Array.isArray(body) || body.length === 0) {
      throw new BadRequestException('Array of source orders is required');
    }

    try {
      const success = await this.videoSourcesService.reorderSources(body);

      return {
        success,
        message: 'Video sources reordered successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Get configuration status
   */
  @Get('status/check')
  async getConfigurationStatus() {
    const hasConfigured =
      await this.videoSourcesService.hasConfiguredSources();
    const sources = hasConfigured
      ? await this.videoSourcesService.getActiveSources()
      : [];

    return {
      success: true,
      configured: hasConfigured,
      sourceCount: sources.length,
      activeSourceCount: sources.filter((s) => s.isActive).length,
      message: hasConfigured
        ? `${sources.length} video source(s) configured`
        : 'No video sources configured. Please add a video source directory.',
    };
  }
}
