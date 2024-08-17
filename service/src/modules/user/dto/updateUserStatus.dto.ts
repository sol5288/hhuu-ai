import { IsNotEmpty, IsDefined, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateUserStatusDto {
  @ApiProperty({ example: 2, description: '用户状态', required: false })
  @IsNotEmpty({ message: i18nValidationMessage('common.userStatusRequired') })
  @IsDefined({ message: i18nValidationMessage('common.userStatusRequiredParam') })
  @IsIn([0, 1, 2, 3], { message: i18nValidationMessage('common.illegalUserStatus') })
  status: number;

  @ApiProperty({ example: 1, description: '修改的用户id', required: false })
  @IsDefined({ message: i18nValidationMessage('common.userIdRequired') })
  id: number;
}
