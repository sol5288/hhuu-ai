import { LoginByPhoneDto } from './dto/loginByPhone.dt';
import { GlobalConfigService } from '@/modules/globalConfig/globalConfig.service';
import { VerifycationEntity } from '../verification/verifycation.entity';
import { VerificationEnum } from '@/common/constants/verification.constant';
import { VerificationService } from '../verification/verification.service';
import { VerifyCodeDto } from '../verification/dto/verifyCode.dto';
import { UserLoginDto } from './dto/authLogin.dto';
import { UserEntity } from '../user/user.entity';
import { Injectable, HttpException, HttpStatus, Logger, OnModuleInit } from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { compareSync } from 'bcryptjs';
import { UserService } from '../user/user.service';
import { UserRegisterDto } from './dto/authRegister.dto';
import { MailerService } from '../mailer/mailer.service';
import { SentMessageInfo } from 'nodemailer';
import { UserStatusEnum, UserStatusErrMsg } from '@/common/constants/user.constant';
import { UserBalanceService } from '../userBalance/userBalance.service';
import { UpdatePasswordDto } from './dto/updatePassword.dto';
import { ConfigEntity } from '../globalConfig/config.entity';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { createRandomCode, createRandomUid, getClientIp, isExpired } from '@/common/utils';
import { VerificationUseStatusEnum } from '@/common/constants/status.constant';
import * as os from 'os';
import * as fetch from 'isomorphic-fetch';
import { RedisCacheService } from '../redisCache/redisCache.service';
import { UpdatePassByOtherDto } from './dto/updatePassByOther.dto';
import * as svgCaptcha from 'svg-captcha';
import { SendPhoneCodeDto } from './dto/sendPhoneCode.dto';
import { UserRegisterByPhoneDto } from './dto/userRegisterByPhone.dto';
import * as bcrypt from 'bcryptjs';
import { AdminLoginDto } from './dto/adminLogin.dto';
import { I18n, I18nContext, I18nService } from 'nestjs-i18n';

@Injectable()
export class AuthService {
  private ipAddress: string;

  constructor(
    @InjectRepository(ConfigEntity)
    private readonly configEntity: Repository<ConfigEntity>,
    private userService: UserService,
    private jwtService: JwtService,
    private mailerService: MailerService,
    private readonly verificationService: VerificationService,
    private readonly userBalanceService: UserBalanceService,
    private readonly redisCacheService: RedisCacheService,
    private readonly globalConfigService: GlobalConfigService,
    @I18n() private readonly i18n: I18nService,
  ) {}

  async onModuleInit() {
    this.getIp();
  }

  async register(body: UserRegisterDto, req: Request) {
    await this.verificationService.verifyCaptcha(body);
    const user: UserEntity = await this.userService.createUserAndVerifycation(body, req);
    const { username, email, client, id } = user;
    const res: any = { username, email, id };
    client && (res.client = client);
    return res;
  }

  // TODO 通过手机号注册
  async registerByPhone(body: UserRegisterByPhoneDto, req: Request) {
    const { username, password, phone, phoneCode, invitedBy } = body;
    /* 校验账号是否重复 */
    await this.userService.verifyUserRegisterByPhone(body);
    /* 创建mock email 由于初期简历的email为unqie 必须给用户一个默认的邮箱作为唯一身份 */
    /* 校验验证码是否过期 */
    const nameSpace = await this.globalConfigService.getNamespace();
    const key = `${nameSpace}:PHONECODE:${phone}`;
    const redisPhoneCode = await this.redisCacheService.get({ key });
    if (!redisPhoneCode) {
      throw new HttpException(this.i18n.t('common.verificationCodeExpired1'), HttpStatus.BAD_REQUEST);
    }
    if (phoneCode !== redisPhoneCode) {
      throw new HttpException(this.i18n.t('common.verificationCodeIncorrect'), HttpStatus.BAD_REQUEST);
    }

    /* 创建用户 */
    const email = `${createRandomUid()}@hhuu.io`;
    const newUser: any = { username, password, phone, invitedBy, email, status: UserStatusEnum.ACTIVE };
    const userDefautlAvatar = await this.globalConfigService.getConfigs(['userDefautlAvatar']);
    newUser.avatar = userDefautlAvatar;
    const hashedPassword = bcrypt.hashSync(password, 10);
    newUser.password = hashedPassword;
    const u = await this.userService.createUser(newUser);
    /* 如果有邀请人 给与充值奖励 */
    let inviteUser: UserEntity;
    if (invitedBy) {
      inviteUser = await this.userService.qureyUserInfoByInviteCode(invitedBy);
    }
    await this.userBalanceService.addBalanceToNewUser(u.id, inviteUser?.id);
    return;
  }

  async login(user: UserLoginDto, req: Request): Promise<string> {
    const u: UserEntity = await this.userService.verifyUserCredentials(user);
    const { username, id, email, role, openId, client } = u;
    const ip = getClientIp(req);
    await this.userService.savaLoginIp(id, ip);
    const token = await this.jwtService.sign({ username, id, email, role, openId, client });
    await this.redisCacheService.saveToken(id, token);
    return token;
  }

  async loginByPhone(body: LoginByPhoneDto, req: Request): Promise<string> {
    const u: UserEntity = await this.userService.verifyUserCredentials(body);
    const { username, id, email, role, openId, client } = u;
    const ip = getClientIp(req);
    await this.userService.savaLoginIp(id, ip);
    const { phone } = body;
    const token = await this.jwtService.sign({ username, id, email, role, openId, client, phone });
    await this.redisCacheService.saveToken(id, token);
    return token;
  }

  async loginByOpenId(user: UserEntity, req: Request): Promise<string> {
    const { status } = user;
    if (status !== UserStatusEnum.ACTIVE) {
      throw new HttpException(UserStatusErrMsg[status], HttpStatus.BAD_REQUEST);
    }
    const { username, id, email, role, openId, client } = user;
    const ip = getClientIp(req);
    await this.userService.savaLoginIp(id, ip);
    const token = await this.jwtService.sign({ username, id, email, role, openId, client });
    await this.redisCacheService.saveToken(id, token);
    return token;
  }

  async getInfo(req: Request) {
    const { id } = req.user;
    return await this.userService.getUserInfo(id);
  }

  async activateAccount(params: VerifyCodeDto, res: Response) {
    const emailConfigs = await this.configEntity.find({
      where: {
        configKey: In([
          'registerSuccessEmailTitle',
          'registerSuccessEmailTeamName',
          'registerSuccessEmaileAppend',
          'registerFailEmailTitle',
          'registerFailEmailTeamName',
        ]),
      },
    });
    const configMap: any = emailConfigs.reduce((pre, cur: any) => {
      pre[cur.configKey] = cur.configVal;
      return pre;
    }, {});
    try {
      const v: VerifycationEntity = await this.verificationService.verifyCode(params, VerificationEnum.Registration);
      const { type, userId } = v;
      if (type !== VerificationEnum.Registration) {
        throw new HttpException(this.i18n.t('common.verificationCodeTypeError'), HttpStatus.BAD_REQUEST);
      }
      const status: number = await this.userService.getUserStatus(userId);
      if (status === UserStatusEnum.ACTIVE) {
        throw new HttpException(this.i18n.t('common.accountAlreadyActivated'), HttpStatus.BAD_REQUEST);
      }
      await this.userService.updateUserStatus(v.userId, UserStatusEnum.ACTIVE);
      const u: UserEntity = await this.userService.queryUserInfoById(v.userId);
      const { username, email, id, invitedBy } = u;
      /* 如果用户填写了 invitedBy 邀请码 查到邀请人信息 */
      let inviteUser: UserEntity;
      if (invitedBy) {
        inviteUser = await this.userService.qureyUserInfoByInviteCode(invitedBy);
      }
      await this.userBalanceService.addBalanceToNewUser(id, inviteUser?.id);
      res.redirect(
        `/api/auth/registerSuccess?id=${id.toString().padStart(4, '0')}&username=${username}&email=${email}&registerSuccessEmailTitle=${
          configMap.registerSuccessEmailTitle
        }&registerSuccessEmailTeamName=${configMap.registerSuccessEmailTeamName}&registerSuccessEmaileAppend=${
          configMap.registerSuccessEmaileAppend
        }`,
      );
    } catch (error) {
      console.log('error: ', error);
      const message = error.response;
      res.redirect(
        `/api/auth/registerError?message=${message}&registerFailEmailTitle=${configMap.registerFailEmailTitle}&registerFailEmailTeamName=${configMap.registerFailEmailTeamName}`,
      );
    }
  }

  async updatePassword(req: Request, body: UpdatePasswordDto) {
    const { id, client, role } = req.user;
    if (client && Number(client) > 0) {
      throw new HttpException(this.i18n.t('common.noPermission'), HttpStatus.BAD_REQUEST);
    }
    if (role === 'admin') {
      throw new HttpException(this.i18n.t('common.illegalOperation1'), HttpStatus.BAD_REQUEST);
    }
    const bool = await this.userService.verifyUserPassword(id, body.oldPassword);
    if (!bool) {
      throw new HttpException(this.i18n.t('common.oldPasswordIncorrect'), HttpStatus.BAD_REQUEST);
    }
    this.userService.updateUserPassword(id, body.password);
    return this.i18n.t('common.passwordChangeSuccess');
  }

  async updatePassByOther(req: Request, body: UpdatePassByOtherDto) {
    const { id, client } = req.user;
    if (!client) {
      throw new HttpException(this.i18n.t('common.noPermissionForOperation'), HttpStatus.BAD_REQUEST);
    }
    this.userService.updateUserPassword(id, body.password);
    return this.i18n.t('common.passwordChangeSuccess');
  }

  getIp() {
    let ipAddress: string;
    const interfaces = os.networkInterfaces();
    Object.keys(interfaces).forEach((interfaceName) => {
      const interfaceInfo = interfaces[interfaceName];
      for (let i = 0; i < interfaceInfo.length; i++) {
        const alias = interfaceInfo[i];
        if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
          ipAddress = alias.address;
          break;
        }
      }
    });
    this.ipAddress = ipAddress;
  }

  async captcha(parmas) {
    const nameSpace = await this.globalConfigService.getNamespace();
    const { color = '#fff' } = parmas;
    const captcha = svgCaptcha.createMathExpr({ background: color, height: 34, width: 120, noise: 3 });
    const text = captcha.text;
    const randomId = createRandomUid();
    const key = `${nameSpace}:CAPTCHA:${randomId}`;
    await this.redisCacheService.set({ key, val: captcha.text }, 5 * 60);
    return {
      svgCode: captcha.data,
      code: randomId,
    };
  }

  /* 发送验证码 */
  async sendPhoneCode(body: SendPhoneCodeDto) {
    await this.verificationService.verifyCaptcha(body);
    const { phone } = body;
    const nameSpace = await this.globalConfigService.getNamespace();
    const key = `${nameSpace}:PHONECODE:${phone}`;

    const ttl = await this.redisCacheService.ttl(key);
    if (ttl && ttl > 0) {
      throw new HttpException(this.i18n.t('common.smsResendLimit', { args: { ttl } }), HttpStatus.BAD_REQUEST);
    }
    const code = createRandomCode();
    const messageInfo = { phone, code };
    await this.verificationService.sendPhoneCode(messageInfo);
    /* 记录发送的验证码是什么 */
    await this.redisCacheService.set({ key, val: code }, 1 * 60);
    return this.i18n.t('common.verificationCodeSent');
  }

  /* create token */
  createTokenFromFingerprint(fingerprint) {
    const token = this.jwtService.sign({
      username: this.i18n.t('common.guestUser1', { args: { fingerprint } }),
      id: fingerprint,
      email: `${fingerprint}@nine.com`,
      role: 'visitor',
      openId: null,
      client: null,
    });
    return token;
  }
}
