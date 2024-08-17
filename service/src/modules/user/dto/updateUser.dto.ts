import { IsNotEmpty, MinLength, MaxLength, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateUserDto {
  @ApiProperty({ example: 'cooper', nullable: true, description: '用户名称', required: false })
  @MinLength(2, { message: i18nValidationMessage('common.usernameMinLength') })
  @MaxLength(12, { message: i18nValidationMessage('common.usernameMaxLength') })
  @IsNotEmpty({ message: i18nValidationMessage('common.usernameEmpty') })
  @IsOptional()
  username?: string;

  @ApiProperty({ example: 'https://file.jiangly.com/images/93971628.jpeg', description: '用户头像', required: false })
  @IsNotEmpty({ message: i18nValidationMessage('common.userAvatarRequired') })
  @IsOptional()
  avatar?: string;

  @ApiProperty({
    example: '我是一台基于深度学习和自然语言处理技术的 AI 机器人，旨在为用户提供高效、精准、个性化的智能服务。',
    description: '用户签名',
    required: false,
  })
  @IsNotEmpty({ message: i18nValidationMessage('common.userSignatureRequired') })
  @IsOptional()
  sign?: string;
}
