import { GlobalConfigService } from '@/modules/globalConfig/globalConfig.service';
import { VerificationUseStatusEnum } from '../../common/constants/status.constant';
import { UserService } from '../user/user.service';
import { VerifyCodeDto } from './dto/verifyCode.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VerifycationEntity } from './verifycation.entity';
import { UserEntity } from '../user/user.entity';
import { VerificationEnum } from '../../common/constants/verification.constant';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { createRandomCode } from '@/common/utils';
import { UserStatusEnum } from '@/common/constants/user.constant';
import { RedisCacheService } from '../redisCache/redisCache.service';
import { I18n, I18nContext, I18nService } from 'nestjs-i18n';

import * as Core from '@alicloud/pop-core';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(VerifycationEntity)
    private readonly verifycationEntity: Repository<VerifycationEntity>,
    private readonly globalConfigService: GlobalConfigService,
    private readonly redisCacheService: RedisCacheService,
    @I18n() private readonly i18n: I18nService,
  ) {}

  // TODO Transaction failed and cannot be rolled back
  async createVerification(user: UserEntity, type: VerificationEnum, expir = 30 * 60): Promise<VerifycationEntity> {
    const historyVerify = await this.verifycationEntity.findOne({ where: { userId: user.id, type }, order: { createdAt: 'DESC' } });
    // 限制一分钟内不得重新发送
    if (historyVerify && historyVerify.createdAt.getTime() + 1 * 60 * 1000 > Date.now()) {
      const diffS = Math.ceil((historyVerify.createdAt.getTime() + 1 * 60 * 1000 - Date.now()) / 1000);
      throw new HttpException(this.i18n.t('common.resendTimeLimit', { args: { diffS } }), HttpStatus.BAD_REQUEST);
    }
    const code = createRandomCode();
    const expiresAt = new Date(Date.now() + expir * 1000);
    const { id, email } = user;
    const verifycation = { userId: id, type, code, expiresAt, email };
    return await this.verifycationEntity.save(verifycation);
  }

  async verifyCode({ code, id }: VerifyCodeDto, type: VerificationEnum): Promise<VerifycationEntity> {
    const v: VerifycationEntity = await this.verifycationEntity.findOne({ where: { id, type }, order: { createdAt: 'DESC' } });
    if (!v) {
      throw new HttpException(this.i18n.t('common.verificationCodeNotExist'), HttpStatus.BAD_REQUEST);
    }
    if (v.used === VerificationUseStatusEnum.USED) {
      throw new HttpException(this.i18n.t('common.verificationCodeUsed'), HttpStatus.BAD_REQUEST);
    } else {
      v.used = VerificationUseStatusEnum.USED;
      await this.verifycationEntity.update({ id }, v);
    }
    if (Number(v.code) !== Number(code)) {
      throw new HttpException(this.i18n.t('common.incorrectVerificationCode'), HttpStatus.BAD_REQUEST);
    }
    if (v.expiresAt < new Date()) {
      throw new HttpException(this.i18n.t('common.verificationCodeExpired2'), HttpStatus.BAD_REQUEST);
    }
    return v;
  }

  /* 图形验证码校验 */
  async verifyCaptcha(body) {
    const { captchaId, captchaCode } = body;
    const nameSpace = await this.globalConfigService.getNamespace();
    const key = `${nameSpace}:CAPTCHA:${captchaId}`;
    const code = await this.redisCacheService.get({ key });
    await this.redisCacheService.del({ key });
    if (!code) {
      throw new HttpException(this.i18n.t('common.captchaExpired'), HttpStatus.BAD_REQUEST);
    }
    if (!code || code !== captchaCode) {
      throw new HttpException(this.i18n.t('common.incorrectCaptcha'), HttpStatus.BAD_REQUEST);
    }
  }

  async sendPhoneCode(messageInfo) {
    const { accessKeyId, accessKeySecret, SignName, TemplateCode } = await this.globalConfigService.getPhoneVerifyConfig();
    const { phone, code } = messageInfo;
    if (!phone || !code) {
      throw new HttpException(this.i18n.t('common.missingRequiredParams3'), HttpStatus.BAD_REQUEST);
    }
    const client = new Core({ accessKeyId, accessKeySecret, endpoint: 'https://dysmsapi.aliyuncs.com', apiVersion: '2017-05-25' });
    const params = { PhoneNumbers: phone, SignName, TemplateCode, TemplateParam: JSON.stringify({ code }) };
    const requestOption = { method: 'POST', formatParams: false };
    try {
      const response: any = await client.request('SendSms', params, requestOption);
      if (response.Code === 'OK') {
        return true;
      } else {
        throw new HttpException(response.Message || this.i18n.t('common.sendVerificationCodeFailed'), HttpStatus.BAD_REQUEST);
      }
    } catch (error) {
      throw new HttpException(error?.data?.Message || this.i18n.t('common.sendVerificationCodeFailed'), HttpStatus.BAD_REQUEST);
    }
  }
}
