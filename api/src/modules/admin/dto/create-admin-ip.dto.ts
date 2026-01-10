import { IsEmail, IsIP, IsNotEmpty } from 'class-validator';

export class CreateAdminIPDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  ipAddress: string;
}
