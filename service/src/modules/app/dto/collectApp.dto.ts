import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CollectAppDto {
  @ApiProperty({ example: 1, description: '要收藏的appId', required: true })
  @IsNumber({}, { message: i18nValidationMessage('common.idMustBeNumber') })
  appId: number;
}
