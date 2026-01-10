import { IsString, IsInt, IsBoolean, IsOptional, Min } from 'class-validator';

export class InitUploadDto {
  @IsString()
  filename: string;

  @IsInt()
  @Min(1)
  size: number;

  @IsBoolean()
  @IsOptional()
  prefer_downscale_to_1080?: boolean = true;

  @IsBoolean()
  @IsOptional()
  keep_original?: boolean = false;
}