import { IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdatePasswordDto {
  @ApiProperty({ example: '123456', description: '사용자 이전 비밀번호' })
  @IsNotEmpty({ message: i18nValidationMessage('common.passwordEmpty') })
  @MinLength(6, { message: i18nValidationMessage('common.passwordTooShort') })
  @MaxLength(30, { message: i18nValidationMessage('common.passwordTooLong') })
  oldPassword: string;

  @ApiProperty({ example: '666666', description: '사용자 새 비밀번호' })
  @IsNotEmpty({ message: i18nValidationMessage('common.passwordEmpty') })
  @MinLength(6, { message: i18nValidationMessage('common.passwordTooShort') })
  @MaxLength(30, { message: i18nValidationMessage('common.passwordTooLong') })
  password: string;
}
