import { IsNotEmpty, MinLength, MaxLength, IsString, IsIn, IsOptional, Max, Min, ValidateNested, IsNumber, IsDefined } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateAppDto } from './createApp.dto';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateAppDto extends CreateAppDto {
  @ApiProperty({ example: 1, description: '要修改的分类Id', required: true })
  @IsNumber({}, { message: i18nValidationMessage('common.categoryIdMustBeNumber') })
  id: number;
}
