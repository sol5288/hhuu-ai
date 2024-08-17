import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';

export class VerifyCodeDto {
  @ApiProperty({ example: '1', description: '验证码下发id' })
  @IsNotEmpty({ message: i18nValidationMessage('common.missingRequiredParams2') })
  id: number;

  @ApiProperty({ example: '15366754', description: '验证码' })
  @IsNotEmpty({ message: i18nValidationMessage('common.verificationCodeRequired') })
  code: number;
}
