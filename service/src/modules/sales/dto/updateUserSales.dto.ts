import { IsNotEmpty, MinLength, MaxLength, IsString, IsIn, IsOptional, Max, Min, ValidateNested, IsNumber, IsDefined } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BaseEntity } from 'typeorm';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateUserSalesDto {
  @ApiProperty({ example: 10, description: '佣金比例', required: false })
  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('common.commissionRateMustBeNumber') })
  performanceRatio: number;

  @ApiProperty({ example: '超级合伙人', description: '自定义分销商名称', required: false })
  @IsOptional()
  salesOutletName: string;

  @ApiProperty({ example: 1, description: '用户ID' })
  @IsNumber({}, { message: i18nValidationMessage('common.userIdMustBeNumber') })
  userId: number;
}
