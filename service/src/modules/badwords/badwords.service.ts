import { GlobalConfigService } from '../globalConfig/globalConfig.service';
import { HttpException, HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { BadWordsEntity } from './badwords.entity';
import { In, Like, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryBadWordsDto } from './dto/queryBadWords.dto';
import { UpdateBadWordsDto } from './dto/updateBadWords.dto';
import { DelBadWordsDto } from './dto/delBadWords.dto';
import { AddBadWordDto } from './dto/addBadWords.dto';
import axios from 'axios';
import { ViolationLogEntity } from './violationLog.entity';
import { UserEntity } from '../user/user.entity';
import { hideString } from '@/common/utils';
import { I18n, I18nContext, I18nService } from 'nestjs-i18n';

@Injectable()
export class BadwordsService implements OnModuleInit {
  private badWords: string[];
  constructor(
    @InjectRepository(BadWordsEntity)
    private readonly badWordsEntity: Repository<BadWordsEntity>,
    @InjectRepository(ViolationLogEntity)
    private readonly violationLogEntity: Repository<ViolationLogEntity>,
    @InjectRepository(UserEntity)
    private readonly userEntity: Repository<UserEntity>,
    private readonly globalConfigService: GlobalConfigService,
    @I18n() private readonly i18n: I18nService,
  ) {
    this.badWords = [];
  }

  async onModuleInit() {
    this.loadBadWords();
  }

  /* 敏感词匹配 */
  async customSensitiveWords(content, userId) {
    const triggeredWords = [];
    for (let i = 0; i < this.badWords.length; i++) {
      const word = this.badWords[i];
      if (content.includes(word)) {
        triggeredWords.push(word);
      }
    }
    if (triggeredWords.length) {
      await this.recordUserBadWords(userId, content, triggeredWords, [this.i18n.t('common.custom')], this.i18n.t('common.customDetection'));
      const tips = this.i18n.t('common.contentViolation');
      throw new HttpException(tips, HttpStatus.BAD_REQUEST);
    }
  }

  /* 敏感词检测 先检测百度敏感词 后检测自定义的 */
  async checkBadWords(content: string, userId: number) {
    const config = await this.globalConfigService.getSensitiveConfig();
    /* 如果有则启动配置检测 没有则跳过 */
    if (config) {
      await this.checkBadWordsByConfig(content, config, userId);
    }
    /* 自定义敏感词检测 */
    await this.customSensitiveWords(content, userId);
  }

  /* 通过配置信息去检测敏感词 */
  async checkBadWordsByConfig(content: string, config: any, userId) {
    const { useType } = config;
    useType === 'baidu' && (await this.baiduCheckBadWords(content, config.baiduTextAccessToken, userId));
    useType === 'nineai' && (await this.nineaiCheckBadWords(content, config, userId));
  }

  /* 提取百度云敏感词违规类型 */
  extractContent(str) {
    const pattern = /this.i18n.t('common.contentViolationType')/;
    const match = str.match(pattern);
    return match ? match[1] : '';
  }

  /* 通过百度云敏感词检测 */
  async baiduCheckBadWords(content: string, accessToken: string, userId: number) {
    if (!accessToken) return;
    const url = `https://aip.baidubce.com/rest/2.0/solution/v1/text_censor/v2/user_defined?access_token=${accessToken}}`;
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    };
    const response = await axios.post(url, { text: content }, { headers });
    const { conclusion, error_code, error_msg, conclusionType, data } = response.data;
    if (error_code) {
      console.log(this.i18n.t('common.baiduDetectionError'), error_msg);
    }
    // conclusion 审核结果，可取值：合规、不合规、疑似、审核失败
    // conclusionType 1.合规，2.不合规，3.疑似，4.审核失败
    if (conclusionType !== 1) {
      const types = [...new Set(data.map((item) => this.extractContent(item.msg)))];
      const typesJoined = types.join(',');
      await this.recordUserBadWords(userId, content, ['***'], types, this.i18n.t('common.baiduCloudDetection'));
      const tips = this.i18n.t('common.contentViolationTypes', { args: { typesJoined } });
      throw new HttpException(tips, HttpStatus.BAD_REQUEST);
    }
  }

  /* 通过nineai提供的敏感词检测 */
  async nineaiCheckBadWords(content: string, config: any, userId) {
    const { nineaiBuiltInSensitiveApiBase, nineaiBuiltInSensitiveAuthKey } = config;
    if (!nineaiBuiltInSensitiveApiBase || !nineaiBuiltInSensitiveAuthKey) return;
    const res = await axios.post(
      nineaiBuiltInSensitiveApiBase,
      { content },
      { headers: { 'Content-Type': 'application/json', Authorization: nineaiBuiltInSensitiveAuthKey } },
    );
    if (!res.data) return;
    if (res.data.code !== '0') {
      const { msg = this.i18n.t('common.detectionFail') } = res.data;
      throw new HttpException(this.i18n.t('common.sensitiveWordDetection', { args: { msg } }), HttpStatus.BAD_REQUEST);
    }
    if (res.data.word_list && res.data.word_list?.length) {
      const words = [...new Set(res.data.word_list.map((t) => t.keyword))];
      const types = [...new Set(res.data.word_list.map((t) => t.category))];
      await this.recordUserBadWords(userId, content, words, types, this.i18n.t('common.nineAiDetection'));
      const tips = this.formarTips(res.data.word_list);
      throw new HttpException(tips, HttpStatus.BAD_REQUEST);
    }
  }

  /* formarTips */
  formarTips(wordList) {
    const categorys = wordList.map((t) => t.category);
    const unSet = [...new Set(categorys)];
    const unSetJoined = unSet.join(',');
    return this.i18n.t('common.contentContainsSensitiveInfo', { args: { unSetJoined } });
  }

  /* 加载自定义的敏感词 */
  async loadBadWords() {
    const data = await this.badWordsEntity.find({ where: { status: 1 }, select: ['word'] });
    this.badWords = data.map((t) => t.word);
  }

  /* 查询自定义的敏感词 */
  async queryBadWords(query: QueryBadWordsDto) {
    const { page = 1, size = 500, word, status } = query;
    const where: any = {};
    [0, 1, '0', '1'].includes(status) && (where.status = status);
    word && (where.word = Like(`%${word}%`));
    const [rows, count] = await this.badWordsEntity.findAndCount({
      where,
      skip: (page - 1) * size,
      take: size,
      order: { id: 'ASC' },
    });
    return { rows, count };
  }

  /* 删除自定义敏感词 */
  async delBadWords(body: DelBadWordsDto) {
    const b = await this.badWordsEntity.findOne({ where: { id: body.id } });
    if (!b) {
      throw new HttpException(this.i18n.t('common.sensitiveWordNotExist'), HttpStatus.BAD_REQUEST);
    }
    const res = await this.badWordsEntity.delete({ id: body.id });
    if (res.affected > 0) {
      await this.loadBadWords();
      return this.i18n.t('common.deleteSensitiveWordSuccess');
    } else {
      throw new HttpException(this.i18n.t('common.deleteSensitiveWordFail'), HttpStatus.BAD_REQUEST);
    }
  }

  /* 修改自定义敏感词 */
  async updateBadWords(body: UpdateBadWordsDto) {
    const { id, word, status } = body;
    const b = await this.badWordsEntity.findOne({ where: { word } });
    if (b) {
      throw new HttpException(this.i18n.t('common.sensitiveWordAlreadyExists'), HttpStatus.BAD_REQUEST);
    }
    const res = await this.badWordsEntity.update({ id }, { word, status });
    if (res.affected > 0) {
      await this.loadBadWords();
      return this.i18n.t('common.updateSensitiveWordSuccess');
    } else {
      throw new HttpException(this.i18n.t('common.updateSensitiveWordFail'), HttpStatus.BAD_REQUEST);
    }
  }

  async addBadWord(body: AddBadWordDto) {
    const { word } = body;
    const b = await this.badWordsEntity.findOne({ where: { word } });
    if (b) {
      throw new HttpException(this.i18n.t('common.sensitiveWordExists'), HttpStatus.BAD_REQUEST);
    }
    await this.badWordsEntity.save({ word });
    await this.loadBadWords();
    return this.i18n.t('common.addSensitiveWordSuccess');
  }

  /* 记录用户违规次数内容 */
  async recordUserBadWords(userId, content, words, typeCn, typeOriginCn) {
    const data = {
      userId,
      content,
      words: JSON.stringify(words),
      typeCn: JSON.stringify(typeCn),
      typeOriginCn,
    };
    try {
      await this.userEntity
        .createQueryBuilder()
        .update(UserEntity)
        .set({ violationCount: () => 'violationCount + 1' })
        .where('id = :userId', { userId })
        .execute();
      await this.violationLogEntity.save(data);
    } catch (error) {
      console.log('error: ', error);
    }
  }

  /* 违规记录 */
  async violation(req, query) {
    const { role } = req.user;
    const { page = 1, size = 10, userId, typeOriginCn } = query;
    const where = {};
    userId && (where['userId'] = userId);
    typeOriginCn && (where['typeOriginCn'] = typeOriginCn);
    const [rows, count] = await this.violationLogEntity.findAndCount({
      where,
      skip: (page - 1) * size,
      take: size,
      order: { id: 'DESC' },
    });
    const userIds = [...new Set(rows.map((t) => t.userId))];
    const usersInfo = await this.userEntity.find({
      where: { id: In(userIds) },
      select: ['id', 'avatar', 'username', 'email', 'violationCount', 'status'],
    });
    rows.forEach((t: any) => {
      const user: any = usersInfo.find((u) => u.id === t.userId);
      role !== 'super' && (user.email = hideString(user.email));
      t.userInfo = user;
    });

    return { rows, count };
  }
}
