import { IsNotEmpty, MinLength, MaxLength, IsEmail, IsOptional, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UserRegisterByPhoneDto {
  @ApiProperty({ example: 'cooper', description: '用户名称' })
  @IsNotEmpty({ message: i18nValidationMessage('common.usernameEmpty') })
  @MinLength(2, { message: i18nValidationMessage('common.usernameMinLength') })
  @MaxLength(12, { message: i18nValidationMessage('common.usernameMaxLength') })
  username?: string;

  @ApiProperty({ example: '123456', description: '用户密码' })
  @IsNotEmpty({ message: i18nValidationMessage('common.passwordEmpty') })
  @MinLength(6, { message: i18nValidationMessage('common.passwordTooShort') })
  @MaxLength(30, { message: i18nValidationMessage('common.passwordTooLong') })
  password: string;

  @ApiProperty({ example: '19999999999', description: '用户手机号码' })
  @IsPhoneNumber('CN', { message: i18nValidationMessage('common.invalidPhoneFormat2') })
  @IsNotEmpty({ message: i18nValidationMessage('common.phoneNumberRequired') })
  phone: string;

  @ApiProperty({ example: '152546', description: '手机验证码' })
  @IsNotEmpty({ message: i18nValidationMessage('common.phoneVerificationCodeEmpty') })
  phoneCode: string;

  @ApiProperty({ example: 'SNINE', description: '用户邀请码', required: true })
  @IsOptional()
  invitedBy: string;
}
