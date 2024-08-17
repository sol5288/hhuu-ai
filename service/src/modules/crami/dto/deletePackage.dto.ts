import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class DeletePackageDto {
  @ApiProperty({ example: 1, description: '要修改的套餐Id', required: true })
  @IsNumber({}, { message: i18nValidationMessage('common.planIdMustBeNumber') })
  id: number;
}
