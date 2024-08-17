import { IsNotEmpty, MinLength, MaxLength, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UserRegisterDto {
  @ApiProperty({ example: 'cooper', description: '用户名称' })
  @IsNotEmpty({ message: i18nValidationMessage('common.usernameEmpty') })
  @MinLength(2, { message: i18nValidationMessage('common.usernameMinLength') })
  @MaxLength(12, { message: i18nValidationMessage('common.usernameMaxLength') })
  username?: string;

  @ApiProperty({ example: '123456', description: '用户密码' })
  @IsNotEmpty({ message: i18nValidationMessage('common.passwordEmpty') })
  @MinLength(6, { message: i18nValidationMessage('common.passwordTooShort') })
  @MaxLength(30, { message: i18nValidationMessage('common.passwordTooLong') })
  password: string;

  @ApiProperty({ example: 'J_longyan@163.com', description: '用户邮箱' })
  @IsEmail({}, { message: i18nValidationMessage('common.invalidEmailFormat') })
  @IsNotEmpty({ message: i18nValidationMessage('common.emailEmpty') })
  email: string;

  @ApiProperty({ example: '5k3n', description: '图形验证码' })
  @IsNotEmpty({ message: i18nValidationMessage('common.verificationCodeEmpty') })
  captchaCode: string;

  @ApiProperty({ example: '2313ko423ko', description: '图形验证码KEY' })
  @IsNotEmpty({ message: i18nValidationMessage('common.verificationIdEmpty') })
  captchaId: string;

  @ApiProperty({ example: 'FRJDLJHFNV', description: '用户填写的别人邀请码', required: false })
  @IsOptional()
  invitedBy: string;

  @ApiProperty({
    example: 'https://public-1300678944.cos.ap-shanghai.myqcloud.com/blog/1682571295452image.png',
    description: '用户头像',
    required: false,
  })
  @IsOptional()
  avatar: string;

  @ApiProperty({ example: 'default', description: '用户注册来源', required: false })
  @IsOptional()
  client: string;
}
