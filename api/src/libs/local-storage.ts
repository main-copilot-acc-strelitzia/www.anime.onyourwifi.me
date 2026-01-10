import * as fs from 'fs';
import * as path from 'path';
import { createReadStream, createWriteStream } from 'fs';

/**
 * Local filesystem storage provider for offline, LAN-ready operation.
 * Replaces AWS S3 / MinIO dependencies with direct filesystem access.
 * All files stored in /opt/strelitzia/storage or configurable path.
 */

const STORAGE_BASE_PATH = process.env.STORAGE_PATH || '/opt/strelitzia/storage';
const UPLOADS_PATH = path.join(STORAGE_BASE_PATH, 'uploads');
const VIDEOS_PATH = path.join(STORAGE_BASE_PATH, 'videos');
const THUMBNAILS_PATH = path.join(STORAGE_BASE_PATH, 'thumbnails');

/**
 * Initialize storage directories
 */
export function initializeStorage() {
  [STORAGE_BASE_PATH, UPLOADS_PATH, VIDEOS_PATH, THUMBNAILS_PATH].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
    }
  });
}

/**
 * Get full filesystem path for a file
 */
export function getFilePath(fileType: 'upload' | 'video' | 'thumbnail', key: string): string {
  const baseDirs = {
    upload: UPLOADS_PATH,
    video: VIDEOS_PATH,
    thumbnail: THUMBNAILS_PATH,
  };
  return path.join(baseDirs[fileType], key);
}

/**
 * Create a write stream for uploading a file
 */
export function createUploadStream(key: string): { stream: NodeJS.WritableStream; filePath: string } {
  const filePath = getFilePath('upload', key);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
  }
  const stream = createWriteStream(filePath, { mode: 0o644 });
  return { stream, filePath };
}

/**
 * Create a read stream for downloading a file
 */
export function createDownloadStream(fileType: 'upload' | 'video' | 'thumbnail', key: string): NodeJS.ReadableStream {
  const filePath = getFilePath(fileType, key);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return createReadStream(filePath);
}

/**
 * Check if a file exists
 */
export function fileExists(fileType: 'upload' | 'video' | 'thumbnail', key: string): boolean {
  const filePath = getFilePath(fileType, key);
  return fs.existsSync(filePath);
}

/**
 * Get file size in bytes
 */
export function getFileSize(fileType: 'upload' | 'video' | 'thumbnail', key: string): number {
  const filePath = getFilePath(fileType, key);
  if (!fs.existsSync(filePath)) {
    return 0;
  }
  const stats = fs.statSync(filePath);
  return stats.size;
}

/**
 * Delete a file
 */
export function deleteFile(fileType: 'upload' | 'video' | 'thumbnail', key: string): void {
  const filePath = getFilePath(fileType, key);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

/**
 * List files in a directory
 */
export function listFiles(fileType: 'upload' | 'video' | 'thumbnail', prefix: string = ''): string[] {
  const filePath = getFilePath(fileType, prefix);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    return [];
  }
  try {
    const files = fs.readdirSync(dir, { recursive: true });
    return files.filter((f) => typeof f === 'string').map((f) => f as string);
  } catch {
    return [];
  }
}

/**
 * Move/rename a file
 */
export function moveFile(fileType: 'upload' | 'video' | 'thumbnail', oldKey: string, newKey: string): void {
  const oldPath = getFilePath(fileType, oldKey);
  const newPath = getFilePath(fileType, newKey);
  if (!fs.existsSync(oldPath)) {
    throw new Error(`Source file not found: ${oldPath}`);
  }
  const newDir = path.dirname(newPath);
  if (!fs.existsSync(newDir)) {
    fs.mkdirSync(newDir, { recursive: true, mode: 0o755 });
  }
  fs.renameSync(oldPath, newPath);
}

/**
 * Get file stream readable for serving to clients
 */
export function serveFile(fileType: 'upload' | 'video' | 'thumbnail', key: string) {
  const filePath = getFilePath(fileType, key);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return {
    stream: createReadStream(filePath),
    size: fs.statSync(filePath).size,
  };
}
