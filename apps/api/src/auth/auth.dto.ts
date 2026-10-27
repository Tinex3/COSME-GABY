import { IsArray, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsArray()
  @IsString({ each: true })
  roles: string[];
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
