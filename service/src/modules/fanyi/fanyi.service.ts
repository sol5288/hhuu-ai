import { GlobalConfigService } from '../globalConfig/globalConfig.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';
import { I18n, I18nContext, I18nService } from 'nestjs-i18n';

@Injectable()
export class FanyiService {
  constructor(private readonly globalConfigService: GlobalConfigService, @I18n() private readonly i18n: I18nService) {}

  async convertToEnglish(text: string) {
    if (!text) throw new HttpException(`请输入要翻译的内容!`, HttpStatus.BAD_REQUEST);
    const { baiduFanyiAppId, baiduFanyiSecret } = await this.globalConfigService.getConfigs(['baiduFanyiAppId', 'baiduFanyiSecret']);
    if (!baiduFanyiAppId || !baiduFanyiSecret) {
      throw new HttpException(this.i18n.t('common.translationServiceUnavailable'), HttpStatus.BAD_REQUEST);
    }
    const salt = Date.now().toString();
    const sign = crypto
      .createHash('md5')
      .update(baiduFanyiAppId + text + salt + baiduFanyiSecret)
      .digest('hex');
    const url = 'https://fanyi-api.baidu.com/api/trans/vip/translate';
    const params = {
      q: text.toString(),
      from: 'auto',
      to: 'en',
      appid: baiduFanyiAppId,
      salt,
      sign,
    };
    const res = await axios.post(url, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const { from, to, trans_result, error_code, error_msg } = res.data;
    if (error_code) {
      console.log('res: ', res);
      throw new HttpException(this.i18n.t('common.translationFailed', { args: { error_code, error_msg } }), HttpStatus.BAD_REQUEST);
    }
    if (!trans_result || !trans_result.length) {
      console.log('res: ', res);
      throw new HttpException(this.i18n.t('common.translationFailed', { args: { error_code, error_msg } }), HttpStatus.BAD_REQUEST);
    } else {
    }
    return trans_result[0].dst;
  }
}
