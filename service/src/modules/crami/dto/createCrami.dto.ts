import {
  IsNotEmpty,
  IsString,
  IsIn,
  IsOptional,
  IsNumber,
  IsDefined,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreatCramiDto {
  @ApiProperty({ example: 1, description: '套餐类型', required: true })
  @IsNumber({}, { message: i18nValidationMessage('common.planTypeMustBeNumber') })
  @IsOptional()
  packageId: number;

  @ApiProperty({ example: 1, description: '单次生成卡密数量' })
  @IsNumber({}, { message: i18nValidationMessage('common.cardCreationCount') })
  @Max(50, { message: i18nValidationMessage('common.maxCardCreationCount') })
  @Min(1, { message: i18nValidationMessage('common.minCardCreationCount') })
  @IsOptional()
  count: number;

  @ApiProperty({ example: 0, description: '卡密携带模型3额度' })
  @IsNumber({}, { message: i18nValidationMessage('common.cardBalanceMustBeNumber') })
  @IsOptional()
  model3Count: number;

  @ApiProperty({ example: 100, description: '卡密携带模型4额度' })
  @IsNumber({}, { message: i18nValidationMessage('common.cardQuotaTypeMustBeNumber') })
  @IsOptional()
  model4Count: number;

  @ApiProperty({ example: 3, description: '卡密携带MJ绘画额度' })
  @IsNumber({}, { message: i18nValidationMessage('common.cardQuotaTypeMustBeNumber') })
  @IsOptional()
  drawMjCount: number;
}
