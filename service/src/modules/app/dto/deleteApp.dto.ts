import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class OperateAppDto {
  @ApiProperty({ example: 1, description: '要删除的appId', required: true })
  @IsNumber({}, { message: i18nValidationMessage('common.idMustBeNumber') })
  id: number;
}
