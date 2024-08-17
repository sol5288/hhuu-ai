import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class DeleteCatsDto {
  @ApiProperty({ example: 1, description: '要删除app分类Id', required: true })
  @IsNumber({}, { message: i18nValidationMessage('common.idMustBeNumber') })
  id: number;
}
