/**
 * @deprecated
 * This S3 client has been replaced with local filesystem storage.
 * See api/src/libs/local-storage.ts for the new storage implementation.
 */

import { Provider } from '@nestjs/common';

// Stub export for backward compatibility
export const s3 = null;

export const s3Provider: Provider = {
  provide: 'S3',
  useValue: null,
};

export function getPresignedPutUrl(Key: string, ContentType = 'application/octet-stream') {
  throw new Error('S3 is no longer supported. Use local filesystem storage instead.');
}

export function getPresignedGetUrl(Key: string, ttlSec = 300) {
  throw new Error('S3 is no longer supported. Use local filesystem storage instead.');
}