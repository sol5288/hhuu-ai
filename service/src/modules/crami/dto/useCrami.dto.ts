import { IsDefined } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UseCramiDto {
  @ApiProperty({ example: 'ffar684rv254fs4f', description: '卡密信息', required: true })
  @IsDefined({ message: i18nValidationMessage('common.planNameRequired') })
  code: string;
}
