import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma';
import * as fs from 'fs';
import * as path from 'path';

export interface VideoSourceConfig {
  id: string;
  name: string;
  path: string;
  type: 'local' | 'network';
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class VideoSourcesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all configured video sources
   */
  async getAllSources(): Promise<VideoSourceConfig[]> {
    try {
      const sources = await this.prisma.videoSource.findMany({
        orderBy: { priority: 'asc' },
      });
      return sources.map(s => ({ ...s, type: s.type as 'local' | 'network' }));
    } catch (error) {
      console.error('Error fetching video sources:', error);
      return [];
    }
  }

  /**
   * Get active video sources only
   */
  async getActiveSources(): Promise<VideoSourceConfig[]> {
    try {
      const sources = await this.prisma.videoSource.findMany({
        where: { isActive: true },
        orderBy: { priority: 'asc' },
      });
      return sources.map(s => ({ ...s, type: s.type as 'local' | 'network' }));
    } catch (error) {
      console.error('Error fetching active sources:', error);
      return [];
    }
  }

  /**
   * Add a new video source
   */
  async addSource(
    name: string,
    directoryPath: string,
    type: 'local' | 'network' = 'local',
    priority: number = 0,
  ): Promise<VideoSourceConfig | null> {
    try {
      // Validate directory exists
      if (!this.validateDirectoryExists(directoryPath)) {
        throw new Error(`Directory does not exist: ${directoryPath}`);
      }

      // Check if source with same path already exists
      const existingSource = await this.prisma.videoSource.findFirst({
        where: { path: directoryPath },
      });

      if (existingSource) {
        throw new Error(`Video source with this path already exists`);
      }

      // Create new source
      const source = await this.prisma.videoSource.create({
        data: {
          name,
          path: directoryPath,
          type,
          isActive: true,
          priority,
        },
      });

      return { ...source, type: source.type as 'local' | 'network' };
    } catch (error) {
      console.error('Error adding video source:', error);
      throw error;
    }
  }

  /**
   * Update an existing video source
   */
  async updateSource(
    id: string,
    updates: {
      name?: string;
      path?: string;
      isActive?: boolean;
      priority?: number;
    },
  ): Promise<VideoSourceConfig | null> {
    try {
      // If path is being updated, validate it exists
      if (updates.path && !this.validateDirectoryExists(updates.path)) {
        throw new Error(`Directory does not exist: ${updates.path}`);
      }

      // Check if another source has the same path
      if (updates.path) {
        const existingSource = await this.prisma.videoSource.findFirst({
          where: {
            path: updates.path,
            id: { not: id },
          },
        });

        if (existingSource) {
          throw new Error(`Another source already uses this path`);
        }
      }

      const source = await this.prisma.videoSource.update({
        where: { id },
        data: updates,
      });

      return { ...source, type: source.type as 'local' | 'network' };
    } catch (error) {
      console.error('Error updating video source:', error);
      throw error;
    }
  }

  /**
   * Delete a video source
   */
  async deleteSource(id: string): Promise<boolean> {
    try {
      await this.prisma.videoSource.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error('Error deleting video source:', error);
      throw error;
    }
  }

  /**
   * Get video files from all active sources
   */
  async getVideosFromAllSources(): Promise<
    Array<{ file: string; source: VideoSourceConfig }>
  > {
    const activeSources = await this.getActiveSources();

    if (activeSources.length === 0) {
      return [];
    }

    const allFiles: Array<{ file: string; source: VideoSourceConfig }> = [];

    for (const source of activeSources) {
      try {
        const files = this.getVideoFilesFromDirectory(source.path);
        files.forEach((file) => {
          allFiles.push({ file, source });
        });
      } catch (error) {
        console.error(`Error reading source ${source.name}:`, error);
      }
    }

    return allFiles;
  }

  /**
   * Get video files from a specific directory
   */
  private getVideoFilesFromDirectory(dirPath: string): string[] {
    try {
      if (!fs.existsSync(dirPath)) {
        return [];
      }

      const videoExtensions = [
        '.mp4',
        '.mkv',
        '.avi',
        '.mov',
        '.flv',
        '.webm',
        '.m4v',
        '.3gp',
        '.ogv',
      ];

      const files = fs.readdirSync(dirPath);

      return files
        .filter((file) => {
          const ext = path.extname(file).toLowerCase();
          return videoExtensions.includes(ext);
        })
        .map((file) => path.join(dirPath, file));
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error);
      return [];
    }
  }

  /**
   * Validate that a directory exists and is readable
   */
  private validateDirectoryExists(dirPath: string): boolean {
    try {
      return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
    } catch (error) {
      return false;
    }
  }

  /**
   * Test if a directory path is accessible
   */
  async testDirectoryAccess(dirPath: string): Promise<{
    accessible: boolean;
    error?: string;
    videoCount?: number;
  }> {
    try {
      if (!fs.existsSync(dirPath)) {
        return { accessible: false, error: 'Directory does not exist' };
      }

      if (!fs.statSync(dirPath).isDirectory()) {
        return { accessible: false, error: 'Path is not a directory' };
      }

      const files = this.getVideoFilesFromDirectory(dirPath);
      return { accessible: true, videoCount: files.length };
    } catch (error) {
      return { accessible: false, error: error.message };
    }
  }

  /**
   * Check if any video sources are configured
   */
  async hasConfiguredSources(): Promise<boolean> {
    try {
      const count = await this.prisma.videoSource.count();
      return count > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get source by ID
   */
  async getSourceById(id: string): Promise<VideoSourceConfig | null> {
    try {
      const source = await this.prisma.videoSource.findUnique({
        where: { id },
      });
      return source ? { ...source, type: source.type as 'local' | 'network' } : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Reorder sources by priority
   */
  async reorderSources(
    sourceOrder: Array<{ id: string; priority: number }>,
  ): Promise<boolean> {
    try {
      for (const item of sourceOrder) {
        await this.prisma.videoSource.update({
          where: { id: item.id },
          data: { priority: item.priority },
        });
      }
      return true;
    } catch (error) {
      console.error('Error reordering sources:', error);
      throw error;
    }
  }
}
