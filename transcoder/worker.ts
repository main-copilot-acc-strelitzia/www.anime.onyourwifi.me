/**
 * Strelitzia Transcoder Worker - Production Offline Edition
 * 
 * Offline-ready HLS transcoder with local filesystem storage:
 * - Monitors Redis queue for transcoding jobs
 * - Processes video files from local storage
 * - Generates HLS segments for multiple resolutions (360p, 480p, 720p, 1080p)
 * - Supports MP4, MKV, WebM, AVI, MOV, FLV formats
 * - Stores outputs locally on SSD (/videos/<episode-id>/)
 * - Updates database with file paths and completion status
 * - Provides comprehensive error logging and recovery
 * - Runs completely offline without external dependencies
 */

import Redis from 'ioredis';
import { PrismaClient, TranscodingStatus } from '@prisma/client';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execFileAsync = promisify(execFile);

// Configuration from environment
const STORAGE_ROOT = process.env.STORAGE_ROOT || '/videos';
const WORK_DIR = process.env.WORK_DIR || '/tmp/transcoding-workdir';
const LOG_DIR = process.env.LOG_DIR || '/var/log/strelitzia';
const UPLOADS_PATH = process.env.UPLOADS_PATH || '/opt/strelitzia/storage';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const NODE_ENV = process.env.NODE_ENV || 'production';

// HLS configuration
const HLS_SEGMENT_DURATION = 10; // 10-second segments
const HLS_SEGMENT_COUNT = 3; // Keep 3 segments in playlist

// Resolution presets for HLS transcoding
const RESOLUTIONS = [
  {
    name: '360p',
    width: 640,
    height: 360,
    bitrate: '800k',
    audioBitrate: '128k',
  },
  {
    name: '480p',
    width: 854,
    height: 480,
    bitrate: '1500k',
    audioBitrate: '128k',
  },
  {
    name: '720p',
    width: 1280,
    height: 720,
    bitrate: '3500k',
    audioBitrate: '192k',
  },
  {
    name: '1080p',
    width: 1920,
    height: 1080,
    bitrate: '6000k',
    audioBitrate: '192k',
  },
];

// Initialize clients
const redis = new Redis(REDIS_URL);
const prisma = new PrismaClient();

// Logger utility
function log(level: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...(data && { data }),
  };
  
  console.log(`[${level}] ${timestamp} - ${message}`, data || '');
  
  // Write to log file
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
  const logFile = path.join(LOG_DIR, 'transcoder.log');
  fs.appendFileSync(
    logFile,
    JSON.stringify(logEntry) + '\n',
  );
}

function getLogFile(jobId: string): string {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
  return path.join(LOG_DIR, `transcoding-${jobId}.log`);
}

// Ensure directory exists with proper permissions
async function ensureDir(dirPath: string): Promise<void> {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true, mode: 0o755 });
    log('info', `Created directory: ${dirPath}`);
  }
}

// Get video information using ffprobe
async function getVideoInfo(inputPath: string): Promise<any> {
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration:stream=width,height,codec_type',
      '-of', 'json',
      inputPath,
    ]);
    return JSON.parse(stdout);
  } catch (error) {
    throw new Error(`Failed to probe video: ${error.message}`);
  }
}

// Validate input file exists and is readable
async function validateInputFile(filePath: string): Promise<void> {
  try {
    await fs.promises.access(filePath, fs.constants.R_OK);
  } catch (error) {
    throw new Error(`Input file not accessible: ${filePath}`);
  }
}

// Generate HLS master playlist
async function generateMasterPlaylist(
  outputDir: string,
  episodeId: string,
  resolutions: typeof RESOLUTIONS,
): Promise<void> {
  const playlistPath = path.join(outputDir, 'master.m3u8');
  const lines = [
    '#EXTM3U',
    '#EXT-X-VERSION:3',
    '#EXT-X-INDEPENDENT-SEGMENTS',
  ];

  for (const resolution of resolutions) {
    const bandwidth = parseInt(resolution.bitrate) * 1000 + parseInt(resolution.audioBitrate) * 1000;
    lines.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${resolution.width}x${resolution.height}`,
      `${resolution.name}/playlist.m3u8`,
    );
  }

  await fs.promises.writeFile(playlistPath, lines.join('\n'));
  log('info', `Generated master playlist: ${playlistPath}`);
}

// Transcode video to specific resolution
async function transcodeResolution(
  inputPath: string,
  outputDir: string,
  resolution: typeof RESOLUTIONS[0],
  jobId: string,
): Promise<void> {
  const resolutionDir = path.join(outputDir, resolution.name);
  await ensureDir(resolutionDir);

  const playlistPath = path.join(resolutionDir, 'playlist.m3u8');
  const segmentPath = path.join(resolutionDir, 'segment_%03d.ts');
  const logFile = getLogFile(jobId);

  const ffmpegArgs = [
    // Input
    '-i', inputPath,
    
    // Video codec and settings
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-b:v', resolution.bitrate,
    '-maxrate', `${parseInt(resolution.bitrate) * 1.5}k`,
    '-bufsize', `${parseInt(resolution.bitrate) * 2}k`,
    '-vf', `scale=${resolution.width}:${resolution.height}:force_original_aspect_ratio=decrease,pad=${resolution.width}:${resolution.height}:(ow-iw)/2:(oh-ih)/2`,
    
    // Audio codec and settings
    '-c:a', 'aac',
    '-b:a', resolution.audioBitrate,
    '-ar', '48000',
    
    // HLS settings
    '-hls_time', String(HLS_SEGMENT_DURATION),
    '-hls_segment_type', 'mpegts',
    '-hls_playlist_type', 'event',
    '-hls_list_size', String(HLS_SEGMENT_COUNT),
    '-start_number', '0',
    
    // Output
    '-f', 'hls',
    playlistPath,
  ];

  log('info', `Starting transcode for ${resolution.name}`, { input: inputPath, output: playlistPath });

  try {
    const { stderr } = await execFileAsync('ffmpeg', ffmpegArgs);
    fs.appendFileSync(logFile, `[${resolution.name}] ${stderr}\n`);
    log('info', `Completed transcode for ${resolution.name}`, { resolution: resolution.name });
  } catch (error) {
    fs.appendFileSync(logFile, `[${resolution.name}] ERROR: ${error.message}\n${error.stderr || ''}\n`);
    throw new Error(`FFmpeg transcoding failed for ${resolution.name}: ${error.message}`);
  }
}

// Process a transcoding job
async function processJob(
  job: {
    jobId: string;
    episodeId: string;
    uploadId: string;
  },
): Promise<void> {
  const { jobId, episodeId, uploadId } = job;
  const logFile = getLogFile(jobId);
  
  log('info', 'Processing transcoding job', { jobId, episodeId, uploadId });

  try {
    // Update job status to running
    await prisma.transcodingJob.update({
      where: { id: jobId },
      data: {
        status: 'running',
        startedAt: new Date(),
      },
    });
    fs.writeFileSync(logFile, `Job started at ${new Date().toISOString()}\n`);

    // Get episode details
    const episode = await prisma.episode.findUnique({
      where: { id: episodeId },
      include: { video: true },
    });

    if (!episode) {
      throw new Error(`Episode not found: ${episodeId}`);
    }

    // Determine input file path from upload
    const upload = await prisma.upload.findUnique({
      where: { id: uploadId },
    });

    if (!upload) {
      throw new Error(`Upload not found: ${uploadId}`);
    }

    const inputPath = path.join(UPLOADS_PATH, upload.storedPath);
    await validateInputFile(inputPath);

    // Get video info to determine if resolution can be transcoded
    const videoInfo = await getVideoInfo(inputPath);
    const videoStream = videoInfo.streams.find((s: any) => s.codec_type === 'video');
    const duration = parseFloat(videoInfo.format.duration);

    fs.appendFileSync(
      logFile,
      `Video info: ${videoStream.width}x${videoStream.height}, ${duration.toFixed(2)}s\n`,
    );

    // Create output directory
    const outputDir = path.join(STORAGE_ROOT, episodeId);
    await ensureDir(outputDir);

    // Filter resolutions based on input video size
    const applicableResolutions = RESOLUTIONS.filter((res) => {
      if (videoStream.height < res.height) return false;
      return true;
    });

    if (applicableResolutions.length === 0) {
      throw new Error(
        `Input video height (${videoStream.height}p) is lower than minimum resolution (360p)`,
      );
    }

    fs.appendFileSync(
      logFile,
      `Transcoding to resolutions: ${applicableResolutions.map((r) => r.name).join(', ')}\n`,
    );

    // Transcode each resolution sequentially
    for (const resolution of applicableResolutions) {
      await transcodeResolution(inputPath, outputDir, resolution, jobId);
    }

    // Generate master playlist
    await generateMasterPlaylist(outputDir, episodeId, applicableResolutions);

    // Update episode with filesystem path
    const filesystemPath = path.join(STORAGE_ROOT, episodeId, 'master.m3u8');
    await prisma.episode.update({
      where: { id: episodeId },
      data: {
        filesystem_path: filesystemPath,
      },
    });

    // Update job to success
    const logsText = fs.readFileSync(logFile, 'utf-8');
    await prisma.transcodingJob.update({
      where: { id: jobId },
      data: {
        status: 'success',
        finishedAt: new Date(),
        logsText,
        presetInfo: {
          resolutions: applicableResolutions.map((r) => r.name),
          outputDir,
          mastPlaylistPath: filesystemPath,
        },
      },
    });

    log('info', 'Job completed successfully', { jobId, episodeId, outputDir });
  } catch (error) {
    log('error', 'Job failed', { jobId, episodeId, error: error.message });

    const logsText = fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf-8') : '';
    const finalLogsText = `${logsText}\n\nFINAL ERROR: ${error.message}\n${error.stack || ''}\n`;
    fs.writeFileSync(logFile, finalLogsText);

    await prisma.transcodingJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        finishedAt: new Date(),
        logsText: finalLogsText,
      },
    });

    throw error;
  }
}

// Main worker loop
async function workLoop(): Promise<void> {
  log('info', 'Transcoder worker started', { NODE_ENV, STORAGE_ROOT, WORK_DIR });

  while (true) {
    try {
      // Pop job from queue
      const jobJson = await redis.rpop('transcoding:queue');

      if (!jobJson) {
        // No jobs, wait before checking again
        await new Promise((resolve) => setTimeout(resolve, 5000));
        continue;
      }

      const job = JSON.parse(jobJson);
      log('info', 'Dequeued job', job);

      await processJob(job);
    } catch (error) {
      log('error', 'Worker loop error', { error: error.message });
      // Wait before retrying to avoid busy loop
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

// Graceful shutdown
async function shutdown(): Promise<void> {
  log('info', 'Shutting down transcoder worker');
  await redis.quit();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start worker
workLoop().catch((error) => {
  log('error', 'Fatal worker error', { error: error.message, stack: error.stack });
  process.exit(1);
});