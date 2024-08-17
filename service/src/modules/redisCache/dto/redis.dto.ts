import { IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class RedisDto {
  @ApiProperty({ example: 'name', description: '邮箱' })
  key: string;

  @ApiProperty({ example: '123456', description: '密码' })
  @IsNotEmpty({ message: i18nValidationMessage('common.passwordEmpty') })
  val: string;
}
