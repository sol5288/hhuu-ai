import { IsIn, IsOptional, Max, Min, ValidateNested, IsNumber, IsDefined, isNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BaseEntity } from 'typeorm';
import { i18nValidationMessage } from 'nestjs-i18n';

export class AuditOrderDto {
  @ApiProperty({ example: 1, description: '审核工单状态', required: true })
  @IsIn([1, -1], { message: i18nValidationMessage('common.illegalTicketStatus') })
  status: number;

  @ApiProperty({ example: 1, description: '工单id', required: true })
  @IsNumber({}, { message: i18nValidationMessage('common.ticketIdMustBeNumber') })
  id: number;
}
