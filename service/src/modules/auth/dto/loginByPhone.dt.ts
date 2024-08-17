import { IsNotEmpty, MinLength, MaxLength, IsOptional, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class LoginByPhoneDto {
  @ApiProperty({ example: '19999999', description: '手机号' })
  @IsNotEmpty({ message: i18nValidationMessage('common.phoneNumberEmpty') })
  @IsPhoneNumber('CN', { message: i18nValidationMessage('common.invalidPhoneFormat') })
  phone?: string;

  @ApiProperty({ example: '999999', description: '密码' })
  @IsNotEmpty({ message: i18nValidationMessage('common.passwordEmpty') })
  @MinLength(6, { message: i18nValidationMessage('common.passwordTooShort') })
  @MaxLength(30, { message: i18nValidationMessage('common.passwordTooLong') })
  password: string;
}
