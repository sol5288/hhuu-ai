import { IsNotEmpty, MinLength, MaxLength, IsString, IsIn, IsOptional, Max, Min, ValidateNested, IsNumber, IsDefined } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreatePackageDto } from './createPackage.dto';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdatePackageDto extends CreatePackageDto {
  @ApiProperty({ example: 1, description: '要修改的套餐Id', required: true })
  @IsNumber({}, { message: i18nValidationMessage('common.planIdMustBeNumber') })
  id: number;
}
