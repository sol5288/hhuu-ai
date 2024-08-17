import { HttpException, HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { QueryAutoReplyDto } from './dto/queryAutoReply.dto';
import { AutoReplyEntity } from './autoreplay.entity';
import { Like, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AddAutoReplyDto } from './dto/addAutoReply.dto';
import { UpdateAutpReplyDto } from './dto/updateAutoReply.dto';
import { DelAutoReplyDto } from './dto/delBadWords.dto';
import { I18n, I18nContext, I18nService } from 'nestjs-i18n';

@Injectable()
export class AutoreplyService implements OnModuleInit {
  private autoReplyKes: string[] = [];
  private autoReplyMap = {};
  private autoReplyFuzzyMatch = true;
  constructor(
    @InjectRepository(AutoReplyEntity)
    private readonly autoReplyEntity: Repository<AutoReplyEntity>,
    @I18n() private readonly i18n: I18nService,
  ) {}

  async onModuleInit() {
    this.loadAutoReplyList();
  }

  async loadAutoReplyList() {
    const res = await this.autoReplyEntity.find({ where: { status: 1 }, select: ['prompt', 'answer'] });
    this.autoReplyMap = {};
    res.forEach((t) => (this.autoReplyMap[t.prompt] = t.answer));
    this.autoReplyKes = Object.keys(this.autoReplyMap);
  }

  async checkAutoReply(prompt: string) {
    let question = prompt;
    if (this.autoReplyFuzzyMatch) {
      question = this.autoReplyKes.find((item) => item.includes(prompt));
    }
    return question ? this.autoReplyMap[question] : '';
  }

  async queryAutoreply(query: QueryAutoReplyDto) {
    const { page = 1, size = 10, prompt, status } = query;
    const where: any = {};
    [0, 1, '0', '1'].includes(status) && (where.status = status);
    prompt && (where.prompt = Like(`%${prompt}%`));
    const [rows, count] = await this.autoReplyEntity.findAndCount({
      where,
      skip: (page - 1) * size,
      take: size,
      order: { id: 'DESC' },
    });
    return { rows, count };
  }

  async addAutoreply(body: AddAutoReplyDto) {
    const { prompt } = body;
    const a = await this.autoReplyEntity.findOne({ where: { prompt } });
    if (a) {
      throw new HttpException(this.i18n.t('common.questionExists'), HttpStatus.BAD_REQUEST);
    }
    await this.autoReplyEntity.save(body);
    await this.loadAutoReplyList();
    return this.i18n.t('common.addQuestionSuccess');
  }

  async updateAutoreply(body: UpdateAutpReplyDto) {
    const { id } = body;
    const res = await this.autoReplyEntity.update({ id }, body);
    if (res.affected > 0) {
      await this.loadAutoReplyList();
      return this.i18n.t('common.updateQuestionSuccess');
    }
    throw new HttpException(this.i18n.t('common.updateFail'), HttpStatus.BAD_REQUEST);
  }

  async delAutoreply(body: DelAutoReplyDto) {
    const { id } = body;
    const z = await this.autoReplyEntity.findOne({ where: { id } });
    if (!z) {
      throw new HttpException(this.i18n.t('common.questionNotExist'), HttpStatus.BAD_REQUEST);
    }
    const res = await this.autoReplyEntity.delete({ id });
    if (res.affected > 0) {
      await this.loadAutoReplyList();
      return this.i18n.t('common.deleteQuestionSuccess');
    }
    throw new HttpException(this.i18n.t('common.deleteFail'), HttpStatus.BAD_REQUEST);
  }
}
