import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsNumber } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class BatchDelCramiDto {
  @ApiProperty({ example: 1, description: '要删除的套餐Ids', required: true })
  @IsArray({ message: i18nValidationMessage('common.parameterMustBeArray') })
  @ArrayMinSize(1, { message: i18nValidationMessage('common.minLengthOne') })
  ids: number[];
}
