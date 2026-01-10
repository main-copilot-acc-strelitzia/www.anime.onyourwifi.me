import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  Put,
  Param,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { InitUploadDto } from './dto/init-upload.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Uploads Controller
 * Handles video file upload initialization, completion, and streaming
 * All endpoints require admin role
 */
@Controller('upload')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  /**
   * Initialize single file upload
   * POST /upload/init
   */
  @Post('init')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'main_admin')
  async initUpload(@Body() dto: InitUploadDto, @Req() req: any) {
    return this.uploadsService.initUpload(req.user?.id, dto);
  }

  /**
   * Initialize batch upload (multiple files)
   * POST /upload/init/batch
   */
  @Post('init/batch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'main_admin')
  async initBatch(@Body() dtos: InitUploadDto[], @Req() req: any) {
    return this.uploadsService.initBatch(req.user?.id, dtos);
  }

  /**
   * Complete upload and enqueue for transcoding
   * POST /upload/complete
   */
  @Post('complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'main_admin')
  async complete(@Body() dto: CompleteUploadDto, @Req() req: any) {
    return this.uploadsService.completeUpload(
      req.user?.id,
      dto.uploadId,
      dto.metadata
    );
  }

  /**
   * Get upload status
   * GET /upload/:uploadId/status
   */
  @Get(':uploadId/status')
  @UseGuards(JwtAuthGuard)
  async getStatus(@Param('uploadId') uploadId: string) {
    return this.uploadsService.getUploadStatus(uploadId);
  }

  /**
   * Stream upload endpoint
   * PUT /upload/:uploadId/stream
   * Clients PUT file data to this endpoint after initializing upload
   */
  @Put(':uploadId/stream')
  async uploadStream(
    @Param('uploadId') uploadId: string,
    @Req() req: any,
    @Res() res: Response
  ) {
    try {
      const uploadBasePath = process.env.STORAGE_PATH || '/opt/strelitzia/storage';
      const uploadsPath = path.join(uploadBasePath, 'uploads', uploadId);

      // Validate uploadId format (basic UUID check)
      if (!/^[a-f0-9-]{36}$/.test(uploadId)) {
        return res.status(400).json({ error: 'Invalid uploadId format' });
      }

      // Create upload directory
      if (!fs.existsSync(uploadsPath)) {
        fs.mkdirSync(uploadsPath, { recursive: true, mode: 0o755 });
      }

      // Get filename from header or use default
      const filename = req.get('x-filename') || `upload-${Date.now()}.bin`;

      // Validate filename (prevent directory traversal)
      if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
        return res.status(400).json({ error: 'Invalid filename' });
      }

      const filePath = path.join(uploadsPath, filename);

      // Create write stream with size limit
      const writeStream = fs.createWriteStream(filePath, { mode: 0o644 });
      const maxSize = 100 * 1024 * 1024 * 1024; // 100GB
      let bytesWritten = 0;

      // Monitor stream for size limit
      writeStream.on('write', (chunk: Buffer) => {
        bytesWritten += chunk.length;
        if (bytesWritten > maxSize) {
          writeStream.destroy();
          req.unpipe(writeStream);
          fs.unlinkSync(filePath);
          res.status(413).json({ error: 'File exceeds maximum size' });
        }
      });

      // Pipe request to file
      req.pipe(writeStream);

      writeStream.on('finish', () => {
        res.json({
          success: true,
          status: 'uploaded',
          uploadId,
          filename,
          bytes: bytesWritten,
        });
      });

      writeStream.on('error', (err) => {
        try {
          fs.unlinkSync(filePath);
        } catch {}
        res.status(500).json({
          error: 'Upload failed',
          message: err.message,
        });
      });

      req.on('error', (err) => {
        try {
          fs.unlinkSync(filePath);
        } catch {}
        res.status(400).json({
          error: 'Upload error',
          message: err.message,
        });
      });
    } catch (error) {
      res.status(500).json({
        error: 'Upload error',
        message: (error as any).message,
      });
    }
  }
}