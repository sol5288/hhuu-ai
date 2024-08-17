import { IsDefined } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class TestDto {
  @ApiProperty({ example: 1, nullable: true, description: '查询用户的id', required: false })
  @IsDefined({ message: i18nValidationMessage('common.userIdRequired') })
  id: number;
}
