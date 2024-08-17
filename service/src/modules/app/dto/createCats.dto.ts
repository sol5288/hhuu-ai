import { IsNotEmpty, MinLength, MaxLength, IsString, IsIn, IsOptional, Max, Min, ValidateNested, IsNumber, IsDefined } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateCatsDto {
  @ApiProperty({ example: '编程助手', description: 'app分类名称', required: true })
  @IsDefined({ message: i18nValidationMessage('common.categoryNameRequired') })
  name: string;

  @ApiProperty({
    example: '适用于编程编码、期望成为您的编程助手',
    description: 'app分类名称详情描述',
    required: false,
  })
  @IsDefined({ message: i18nValidationMessage('common.categoryDescRequired') })
  des: string;

  @ApiProperty({ example: 'https://xxxx.png', description: '套餐封面图片' })
  @IsOptional()
  coverImg: string;

  @ApiProperty({ example: 100, description: '套餐排序、数字越大越靠前', required: false })
  @IsOptional()
  order: number;

  @ApiProperty({ example: 1, description: '套餐状态 0：禁用 1：启用', required: true })
  @IsNumber({}, { message: i18nValidationMessage('common.planStatusMustBeNumber') })
  @IsIn([0, 1, 3, 4, 5], { message: i18nValidationMessage('common.planStatusError') })
  status: number;
}
