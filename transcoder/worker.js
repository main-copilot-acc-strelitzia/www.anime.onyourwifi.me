/**
 * Transcoder worker for offline, LAN-ready deployment.
 * Processes video uploads from Redis queue and transcodes to HLS format.
 * All files stored locally in /opt/strelitzia/storage/
 */

const Redis = require('ioredis');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const prisma = new PrismaClient();

const STORAGE_BASE = process.env.STORAGE_PATH || '/opt/strelitzia/storage';
const WORK_DIR = process.env.TRANSCODER_WORK_DIR || '/var/lib/transcoder/work';
const VIDEOS_PATH = path.join(STORAGE_BASE, 'videos');

// Initialize directories
[STORAGE_BASE, WORK_DIR, VIDEOS_PATH].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
  }
});

async function workLoop() {
  console.log('[INFO] Transcoder worker started. Listening for jobs on Redis...');
  while (true) {
    try {
      const jobJson = await redis.rpop('transcoding:queue');
      if (!jobJson) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      const job = JSON.parse(jobJson);
      console.log(`[INFO] Processing transcoding job: ${job.uploadId}`);
      await processJob(job);
    } catch (err) {
      console.error('[ERROR] Worker loop error:', err);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

async function processJob(job) {
  const { uploadId, filePath } = job;

  if (!fs.existsSync(filePath)) {
    console.error(`[ERROR] Source file not found: ${filePath}`);
    await prisma.transcodingJob.update({
      where: { id: uploadId },
      data: { status: 'failed', logsText: 'Source file not found' },
    });
    return;
  }

  const workdir = path.join(WORK_DIR, uploadId);
  fs.mkdirSync(workdir, { recursive: true });
  const sourcePath = filePath;

  // ClamAV scan (optional, skips if not available)
  try {
    const scan = spawnSync('clamdscan', ['--fdpass', sourcePath], { encoding: 'utf-8' });
    if (scan.status !== 0) {
      console.warn(`[WARN] ClamAV scan failed: ${scan.stderr || scan.stdout}`);
      await prisma.transcodingJob.update({
        where: { id: uploadId },
        data: { status: 'failed', logsText: `clamav failure: ${scan.stderr || scan.stdout}` },
      });
      return;
    }
    console.log(`[INFO] ClamAV scan passed for ${uploadId}`);
  } catch (e) {
    console.warn(`[WARN] ClamAV not available. Skipping malware scan. Error: ${e.message}`);
  }

  // FFprobe - analyze video
  const ffprobe = spawnSync('ffprobe', [
    '-v', 'error',
    '-print_format', 'json',
    '-show_streams',
    '-show_format',
    sourcePath,
  ], { encoding: 'utf-8' });

  if (ffprobe.status !== 0) {
    console.error(`[ERROR] FFprobe failed: ${ffprobe.stderr}`);
    await prisma.transcodingJob.update({
      where: { id: uploadId },
      data: { status: 'failed', logsText: ffprobe.stderr },
    });
    return;
  }

  const probe = JSON.parse(ffprobe.stdout);
  const videoStream = (probe.streams || []).find((s) => s.codec_type === 'video') || {};
  const height = videoStream.height || 0;

  console.log(`[INFO] Video analysis: height=${height}, duration=${probe.format?.duration}`);

  const preferDown = job.presetInfo?.prefer_downscale_to_1080 ?? true;
  const keepOriginal = job.presetInfo?.keep_original ?? false;
  const shouldDownscaleTo1080 = preferDown && height > 1080;

  const hlsDir = path.join(workdir, 'hls');
  fs.mkdirSync(hlsDir, { recursive: true });

  try {
    console.log(`[INFO] Starting FFmpeg transcoding for ${uploadId}...`);

    if (shouldDownscaleTo1080) {
      // Transcode to 1080p
      spawnSync('ffmpeg', [
        '-y', '-i', sourcePath,
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '20',
        '-vf', 'scale=-2:1080',
        '-c:a', 'aac', '-b:a', '128k',
        '-g', '48', '-sc_threshold', '0',
        '-f', 'hls', '-hls_time', '6',
        '-hls_segment_filename', path.join(hlsDir, '1080p_seg_%03d.ts'),
        path.join(hlsDir, '1080p_master.m3u8'),
      ], { stdio: 'inherit' });

      // Create lower quality variants
      const renditions = [
        { h: 720, f: '720p' },
        { h: 480, f: '480p' },
        { h: 360, f: '360p' },
      ];

      for (const r of renditions) {
        spawnSync('ffmpeg', [
          '-y', '-i', sourcePath,
          '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
          '-vf', `scale=-2:${r.h}`,
          '-c:a', 'aac', '-b:a', '96k',
          '-g', '48', '-sc_threshold', '0',
          '-f', 'hls', '-hls_time', '6',
          '-hls_segment_filename', path.join(hlsDir, `${r.f}_seg_%03d.ts`),
          path.join(hlsDir, `${r.f}_master.m3u8`),
        ], { stdio: 'inherit' });
      }
    } else {
      // Copy video as-is if already optimal
      spawnSync('ffmpeg', [
        '-y', '-i', sourcePath,
        '-c:v', 'copy', '-c:a', 'copy',
        '-f', 'hls', '-hls_time', '6',
        '-hls_segment_filename', path.join(hlsDir, 'orig_seg_%03d.ts'),
        path.join(hlsDir, 'orig_master.m3u8'),
      ], { stdio: 'inherit' });

      // Create lower quality variants if resolution allows
      const renditions = [];
      if (height > 720) renditions.push({ h: 720, f: '720p' });
      if (height > 480) renditions.push({ h: 480, f: '480p' });
      if (height > 360) renditions.push({ h: 360, f: '360p' });

      for (const r of renditions) {
        spawnSync('ffmpeg', [
          '-y', '-i', sourcePath,
          '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
          '-vf', `scale=-2:${r.h}`,
          '-c:a', 'aac', '-b:a', '96k',
          '-g', '48', '-sc_threshold', '0',
          '-f', 'hls', '-hls_time', '6',
          '-hls_segment_filename', path.join(hlsDir, `${r.f}_seg_%03d.ts`),
          path.join(hlsDir, `${r.f}_master.m3u8`),
        ], { stdio: 'inherit' });
      }
    }

    console.log(`[INFO] FFmpeg transcoding completed for ${uploadId}`);
  } catch (e) {
    console.error(`[ERROR] FFmpeg transcoding failed: ${e}`);
    await prisma.transcodingJob.update({
      where: { id: uploadId },
      data: { status: 'failed', logsText: String(e) },
    });
    return;
  }

  // Generate master playlist
  const master = ['#EXTM3U', '#EXT-X-VERSION:3'];
  if (shouldDownscaleTo1080) {
    master.push('#EXT-X-STREAM-INF:BANDWIDTH=6000000,RESOLUTION=1920x1080');
    master.push('1080p_master.m3u8');
    master.push('#EXT-X-STREAM-INF:BANDWIDTH=3000000,RESOLUTION=1280x720');
    master.push('720p_master.m3u8');
    master.push('#EXT-X-STREAM-INF:BANDWIDTH=1500000,RESOLUTION=854x480');
    master.push('480p_master.m3u8');
    master.push('#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360');
    master.push('360p_master.m3u8');
  } else {
    master.push('#EXT-X-STREAM-INF:BANDWIDTH=4000000');
    master.push('orig_master.m3u8');
    if (fs.existsSync(path.join(hlsDir, '720p_master.m3u8'))) {
      master.push('#EXT-X-STREAM-INF:BANDWIDTH=3000000,RESOLUTION=1280x720');
      master.push('720p_master.m3u8');
    }
  }
  fs.writeFileSync(path.join(hlsDir, 'master.m3u8'), master.join('\n'));

  // Copy HLS files to final storage location
  const uploadVideoDir = path.join(VIDEOS_PATH, uploadId);
  fs.mkdirSync(uploadVideoDir, { recursive: true });

  const files = [];
  const collect = (dir, base = '') => {
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) {
        collect(full, path.join(base, f));
      } else {
        files.push({
          local: full,
          remote: path.posix.join(uploadId, 'hls', base, f).replace(/\\/g, '/'),
          relative: path.posix.join(base, f).replace(/\\/g, '/'),
        });
      }
    }
  };
  collect(hlsDir, '');

  // Copy files locally
  for (const f of files) {
    const destPath = path.join(uploadVideoDir, f.relative);
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(f.local, destPath);
  }

  const masterPlaylistPath = path.join(uploadVideoDir, 'master.m3u8');
  const filesystemPath = path.join('videos', uploadId, 'master.m3u8');

  // Update database with transcoding result
  await prisma.transcodingJob.update({
    where: { id: uploadId },
    data: {
      status: 'success',
      finishedAt: new Date(),
      logsText: 'Transcode completed successfully',
    },
  });

  // Update episode with filesystem path
  await prisma.episode.updateMany({
    where: { id: uploadId },
    data: { filesystem_path: filesystemPath },
  });

  console.log(`[INFO] Transcoding job ${uploadId} completed. Stored at ${masterPlaylistPath}`);

  // Delete original file if not keeping
  if (!keepOriginal) {
    try {
      fs.unlinkSync(sourcePath);
      console.log(`[INFO] Deleted original file: ${sourcePath}`);
    } catch (e) {
      console.warn(`[WARN] Could not delete original: ${e.message}`);
    }
  }

  // Cleanup work directory
  try {
    const rimraf = (dir) => {
      if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach((file) => {
          const curPath = path.join(dir, file);
          if (fs.lstatSync(curPath).isDirectory()) {
            rimraf(curPath);
          } else {
            fs.unlinkSync(curPath);
          }
        });
        fs.rmdirSync(dir);
      }
    };
    rimraf(workdir);
  } catch (e) {
    console.warn(`[WARN] Could not cleanup workdir: ${e.message}`);
  }
}

workLoop();

workLoop();