import { IsNotEmpty, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class SendPhoneCodeDto {
  @ApiProperty({ example: '199999999', description: '手机号' })
  @IsNotEmpty({ message: i18nValidationMessage('common.phoneNumberEmpty') })
  @MinLength(11, { message: i18nValidationMessage('common.phoneNumberLength') })
  @MaxLength(11, { message: i18nValidationMessage('common.phoneNumberLength') })
  phone?: string;

  @ApiProperty({ example: '2b4i1b4', description: '图形验证码KEY' })
  @IsNotEmpty({ message: i18nValidationMessage('common.verificationKeyEmpty') })
  captchaId?: string;

  @ApiProperty({ example: '1g4d', description: '图形验证码' })
  @IsNotEmpty({ message: i18nValidationMessage('common.verificationCodeRequired') })
  captchaCode?: string;
}
