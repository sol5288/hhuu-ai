import { IsNotEmpty, MinLength, MaxLength, IsString, IsIn, IsOptional, Max, Min, ValidateNested, IsNumber, IsDefined } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class GetQrCodeDto {
  @ApiProperty({ example: 'dasdasg2441lk1o24bk', description: '1-64位的字符参数', required: true })
  @IsDefined({ message: i18nValidationMessage('common.sceneStrRequired') })
  sceneStr: string;
}
