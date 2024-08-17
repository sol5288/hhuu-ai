import { IsIn, IsOptional, Max, Min, ValidateNested, IsNumber, IsDefined, isNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BaseEntity } from 'typeorm';
import { i18nValidationMessage } from 'nestjs-i18n';

export class AppForMoneyDto {
  @ApiProperty({ example: 10, description: '提现金额', required: true })
  @IsNumber({}, { message: i18nValidationMessage('common.withdrawalAmountMustBeNumber') })
  @Min(0, { message: i18nValidationMessage('common.withdrawalAmountMustBePositive') })
  withdrawalAmount: number;

  @ApiProperty({ example: 1, description: '提现渠道', required: true })
  @IsIn([1, 2], { message: i18nValidationMessage('common.illegalWithdrawalChannel') })
  withdrawalChannels: number;

  @ApiProperty({ example: 10, description: '提款联系方式', required: true })
  contactInformation: string;

  @ApiProperty({ example: 10, description: '提款备注', required: false })
  @IsOptional()
  remark: string;
}
