import { IsString, IsOptional } from 'class-validator';

export class CompleteUploadDto {
  @IsString()
  uploadId: string;

  @IsOptional()
  metadata?: any;
}