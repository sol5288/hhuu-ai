import { IsNotEmpty, MinLength, MaxLength, IsString, IsIn, IsOptional, Max, Min, ValidateNested, IsNumber, IsDefined } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class TextPromptDto {
  @IsString()
  readonly text: string;

  @IsNumber()
  readonly weight: number;
}

export class StableDrawDto {
  @ApiProperty({ example: 'stable-diffusion-512-v2-1', default: 512, description: '模型id', required: true })
  @IsDefined({ message: i18nValidationMessage('common.modelIdRequired') })
  engineId: string;

  @ApiProperty({
    example: [
      {
        text: 'Draw a cute little dog',
        weight: 0.5,
      },
    ],
    description: '绘画描述信息',
  })
  @Type(() => TextPromptDto)
  @ValidateNested({ each: true })
  text_prompts: TextPromptDto[];

  @ApiProperty({ example: 1, description: '绘画张数', required: true })
  samples = 1;

  @ApiProperty({ example: 512, default: 512, description: '图片尺寸宽度' })
  @Max(1024, { message: i18nValidationMessage('common.maxImageWidth') })
  @Min(512, { message: i18nValidationMessage('common.minImageWidth') })
  width = 512;

  @ApiProperty({ example: 512, default: 512, description: '图片尺寸高度' })
  @Max(1024, { message: i18nValidationMessage('common.maxImageHeight') })
  @Min(512, { message: i18nValidationMessage('common.minImageHeight') })
  height = 512;

  @ApiProperty({ example: 15, default: 7, description: '图片绘制扩散思维[值越高，图像越接近提示]', required: true })
  @Max(35, { message: i18nValidationMessage('common.maxDiffusionSteps') })
  @Min(0, { message: i18nValidationMessage('common.minDiffusionSteps') })
  cfg_scale = 7;

  @ApiProperty({ example: 50, description: '绘制步骤', required: true })
  @Max(150, { message: i18nValidationMessage('common.maxSteps') })
  @Min(10, { message: i18nValidationMessage('common.minSteps') })
  steps = 30;

  @ApiProperty({ example: 'anime', description: '样式预设', required: true })
  @IsIn([
    '3d-model',
    'analog-film',
    'anime',
    'cinematic',
    'comic-book',
    'digital-art',
    'enhance',
    'fantasy-art',
    'isometric',
    'line-art',
    'low-poly',
    'modeling-compound',
    'neon-punk',
    'origami',
    'photographic',
    'pixel-art',
    'tile-texture',
  ])
  style_preset: string;

  @ApiProperty({ example: 'NONE', description: '裁剪指南预设', required: true })
  @IsIn(['NONE', 'FAST_BLUE', 'FAST_GREEN', 'SIMPLE', 'SLOW', 'SLOWER', 'SLOWEST'])
  clip_guidance_preset = 'NONE';
}
