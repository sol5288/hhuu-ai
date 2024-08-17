import { IsDefined } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class MjEnlargeImgDto {
  @ApiProperty({ example: '1105361939590287360', description: '当前大图的message_id、四张的这种才存在有效的', required: true })
  @IsDefined({ message: i18nValidationMessage('common.imageMessageIdRequired') })
  message_id: string;

  @ApiProperty({ example: 1, description: '图片的orderId是必传的 表示放大图片的第几张', required: true })
  @IsDefined({ message: i18nValidationMessage('common.imageSolidOrderIdRequired') })
  orderId: number;
}
