import { MailerService as MService, ISendMailOptions } from '@nestjs-modules/mailer';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { SentMessageInfo } from 'nodemailer';
import { I18n, I18nContext, I18nService } from 'nestjs-i18n';

@Injectable()
export class MailerService {
  constructor(private mailerService: MService, @I18n() private readonly i18n: I18nService) {}

  async sendMail(options: ISendMailOptions): Promise<void> {
    try {
      await this.mailerService.sendMail(options);
    } catch (error) {
      console.log('error: ', error);
      throw new HttpException(this.i18n.t('common.emailSendFailed'), HttpStatus.BAD_REQUEST);
    }
  }
}
