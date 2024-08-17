import { IsNotEmpty, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UserLoginDto {
  @ApiProperty({ example: 'super', description: '邮箱' })
  @IsNotEmpty({ message: i18nValidationMessage('common.usernameEmpty') })
  @MinLength(2, { message: i18nValidationMessage('common.usernameTooShort') })
  @MaxLength(30, { message: i18nValidationMessage('common.usernameTooLong') })
  @IsOptional()
  username?: string;

  @ApiProperty({ example: 1, description: '用户ID' })
  @IsOptional()
  uid?: number;

  @ApiProperty({ example: '999999', description: '密码' })
  @IsNotEmpty({ message: i18nValidationMessage('common.passwordEmpty') })
  @MinLength(6, { message: i18nValidationMessage('common.passwordTooShort') })
  @MaxLength(30, { message: i18nValidationMessage('common.passwordTooLong') })
  password: string;
}
