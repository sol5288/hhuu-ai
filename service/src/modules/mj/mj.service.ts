import { GlobalConfigService } from '../globalConfig/globalConfig.service';
import { UploadService } from '../upload/upload.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';
import * as FormData from 'form-data';
import { MjDrawDto } from './dto/mjDraw.dto';
import { ChatLogService } from '../chatLog/chatLog.service';
import { DeductionKey } from '@/common/constants/balance.constant';
import { Request } from 'express';
import { createRandomUid, getClientIp } from '@/common/utils';
import { MjEnlargeImgDto } from './dto/mjEnlargeImg.dto';
import { ChatLogEntity } from '../chatLog/chatLog.entity';
import { IsNull, Like, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BalanceEntity } from '../userBalance/balance.entity';
import { MjTransformImgDto } from './dto/mjTransform.dto';
import { FanyiService } from '../fanyi/fanyi.service';
import { BadwordsService } from '../badwords/badwords.service';
import { I18n, I18nContext, I18nService } from 'nestjs-i18n';

@Injectable()
export class MjService {
  constructor(
    @InjectRepository(ChatLogEntity)
    private readonly chatLogEntity: Repository<ChatLogEntity>,
    @InjectRepository(BalanceEntity)
    private readonly balanceEntity: Repository<BalanceEntity>,
    private readonly uploadService: UploadService,
    private readonly chatLogService: ChatLogService,
    private readonly globalConfigService: GlobalConfigService,
    private readonly fanyiService: FanyiService,
    private readonly badwordsService: BadwordsService,
    @I18n() private readonly i18n: I18nService,
  ) {}

  private rateLimits = {};
  private drawWorking = [];
  private enlargeWorking = [];
  private queueCount = 0;

  private freeQueueUsers = {}; //对于每个用户有五次免费机会

  /* 绘图方法、由queque调用 */
  async mjDraw(data) {
    const { jobId, prompt, startTime, userId } = data;
    console.log('绘画任务开始', 'mjservice');
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return { a: 1, b: 2 };
  }

  /* 绘图指令 */
  async draw(body: MjDrawDto, req: Request) {
    /* 检测有无绘图权限  */
    await this.checkAuth(req);

    /* 敏感词检测 */
    await this.badwordsService.checkBadWords(body.prompt, req.user.id);

    /* --指令会被MJ官方给移除造成比对失败、非有效--指令将被直接移除 */
    // body.prompt = body.prompt.replace(/--(?!ar|niji|style)/g, '');

    const basicPrompt = body.prompt;
    let fyPrompt = body.prompt;
    /* 配置了百度翻译信息则翻译 否则将不转换 */
    const { baiduFanyiAppId, baiduFanyiSecret } = await this.globalConfigService.getConfigs(['baiduFanyiAppId', 'baiduFanyiSecret']);
    if (baiduFanyiAppId && baiduFanyiSecret) {
      fyPrompt = await this.fanyiService.convertToEnglish(basicPrompt);
    }

    /* 添加随机ID */
    const randomId = `[${createRandomUid()}]`;
    const prompt = `${randomId} ${fyPrompt}`;
    console.log('randomId: ', randomId);
    console.log('prompt -------->  ', prompt);

    const isWorking = this.drawWorking.find((item) => item.includes(body.prompt));
    if (isWorking) {
      throw new HttpException(this.i18n.t('common.promptAlreadyInQueue'), HttpStatus.BAD_REQUEST);
    }

    if (this.queueCount >= 3) {
      throw new HttpException(this.i18n.t('common.drawingTaskQueueFull'), HttpStatus.BAD_REQUEST);
    }

    await this.checkRateLimit(req);

    this.queueCount++;
    const userID = req.user.id;
    console.log(this.i18n.t('common.userQueueIncrease', { args: { userID } }), this.queueCount);

    try {
      /* 查询历史是否已经使用过prompt，如果绘制过这个prompt 拿到绘制过的id 比对的时候排除掉 防止相同prompt拿到相同结果 */
      const historyDraw = await this.chatLogEntity.find({ where: { prompt: Like(`%${prompt}%`) } });
      const histroyMessageIds = historyDraw.map((item) => item.message_id);

      this.drawWorking.push(prompt);
      let drawDetail;
      /* 发送绘画指令 sendRes 如果有结果表示历史有存在的 本次不发新的绘图指令了 false表示正常发送了指令 */
      const sendRes = await this.sendDrawInteractions(prompt, histroyMessageIds, randomId);
      if (sendRes) {
        console.log(this.i18n.t('common.imageExistsInHistory'));
        drawDetail = sendRes;
      } else {
        drawDetail = await this.pollForResult(prompt, histroyMessageIds, randomId);
      }
      this.queueCount--;
      this.queueCount < 0 && (this.queueCount = 0);
      console.log(this.i18n.t('common.drawingTaskEndQueueDecrease'), this.queueCount);
      const { id, content, channel_id, attachments = [], timestamp } = drawDetail;
      /* 拿到结果 存入腾讯云换新的url */
      if (!attachments.length || !attachments[0].url) {
        throw new HttpException(this.i18n.t('common.drawingFailed4'), HttpStatus.BAD_REQUEST);
      }
      const { filename, url, width, height, size } = attachments[0];
      console.log(this.i18n.t('common.gotRemoteAddress'), url);

      const mjNotSaveImg = this.globalConfigService.getConfigs(['mjNotSaveImg']);
      let cosUrl = '';
      if (!Number(mjNotSaveImg) || Number(mjNotSaveImg) === 0) {
        /* 将图片存入cos */
        cosUrl = await this.uploadService.uploadFileFromUrl({ filename, url });
        console.log(this.i18n.t('common.imageSaveComplete'), cosUrl);
      }

      /* 记录图片信息 */
      const logInfo = {
        curIp: getClientIp(req),
        userId: req.user.id,
        type: DeductionKey.PAINT_TYPE,
        prompt,
        answer: cosUrl,
        model: 'mj',
        extend: this.removeEmoji(JSON.stringify(drawDetail)),
        message_id: id,
        variationId: id,
        upscaleId: id, // 后续放大图片的时候需要排除掉这个id避免比对拿到老的
        group: 1,
        isSaveImg: !Number(mjNotSaveImg) || Number(mjNotSaveImg) === 0,
        fileInfo: JSON.stringify({ width, height, size, filename, cosUrl }),
      };
      await this.chatLogService.saveChatLog(logInfo);
      await this.deductBalance(req);
      this.drawWorking = this.drawWorking.filter((item) => item !== body.prompt);
      return cosUrl;
    } catch (error) {
      this.queueCount--;
      this.queueCount < 0 && (this.queueCount = 0);

      console.log(this.i18n.t('common.drawingTaskInterruptedQueueDecrease'), this.queueCount);
      this.drawWorking = this.drawWorking.filter((item) => item !== body.prompt);
      throw new HttpException(error.response, HttpStatus.BAD_REQUEST);
    }
  }

  /* 对单张图放大 U  upscale: 放大像素提升细节 */
  async upscaleSingleImg(body: MjEnlargeImgDto, req: Request) {
    if (this.queueCount >= 3) {
      throw new HttpException(this.i18n.t('common.drawingTaskQueueFull'), HttpStatus.BAD_REQUEST);
    }
    this.queueCount++;
    const userID = req.user.id;
    console.log(this.i18n.t('common.userStartEnlargeImageQueueIncrease', { args: { userID } }), this.queueCount);
    const { message_id, orderId } = body;
    try {
      const historyLog = await this.chatLogEntity.findOne({ where: { message_id } });
      if (!historyLog) {
        throw new HttpException(this.i18n.t('common.imageNotExistInHistory'), HttpStatus.BAD_REQUEST);
      }
      // upscaleId 后续以这个为准
      const isAreadlyEnlarge = await this.chatLogEntity.findOne({ where: { upscaleId: message_id, action: 'enlarge', orderId } });
      if (isAreadlyEnlarge) {
        throw new HttpException(this.i18n.t('common.imageAlreadyEnlarged'), HttpStatus.BAD_REQUEST);
      }
      const { prompt, extend } = historyLog;
      let historyDetailDrawInfo: any = null;
      try {
        historyDetailDrawInfo = JSON.parse(extend);
      } catch (error) {
        historyDetailDrawInfo = [];
      }
      const { components = [] } = historyDetailDrawInfo;
      if (!components.length) {
        throw new HttpException(this.i18n.t('common.noDrawingInfoForImage'), HttpStatus.BAD_REQUEST);
      }
      /* components数组 第一项 有五个数据 分别对应1-4的图片所需参数和重新绘制参数  第二项则是对应变换的四张图  */
      const currentImgComponent = components[0]['components'][orderId - 1];
      const { custom_id } = currentImgComponent;
      console.log('放大custom_id: ', custom_id);
      /* 拿到所需参数 */
      const params = { message_id, custom_id, prompt, orderId };
      await this.sendSmInteractions(params);
      console.log(this.i18n.t('common.enlargeInstructionSentSuccessfully'));
      /* 查询历史是否已经使用过prompt，如果绘制过这个prompt 拿到绘制过的id 比对的时候排除掉 防止相同prompt拿到相同结果 */
      const historyDraw = await this.chatLogEntity.find({ where: { prompt: Like(`%${prompt}%`) } });
      const histroyMessageIds = historyDraw.map((item) => item.message_id);
      console.log(this.i18n.t('common.historicalIdsAlreadyRetrieved'), histroyMessageIds);
      const enlargeImgInfo = await this.pollForUpscaleResult(params, histroyMessageIds);
      this.queueCount--;
      this.queueCount < 0 && (this.queueCount = 0);

      console.log(this.i18n.t('common.enlargeImageTaskEndQueueDecrease'), this.queueCount);
      const { id, content, channel_id, attachments = [], timestamp } = enlargeImgInfo;
      /* 拿到结果 存入腾讯云换新的url */
      if (!attachments.length || !attachments[0].url) {
        throw new HttpException(this.i18n.t('common.failedToEnlargeCurrentImage'), HttpStatus.BAD_REQUEST);
      }
      const { filename, url, width, height, size } = attachments[0];
      const mjNotSaveImg = this.globalConfigService.getConfigs(['mjNotSaveImg']);
      let cosUrl = '';
      if (!Number(mjNotSaveImg) || Number(mjNotSaveImg) === 0) {
        /* 将图片存入cos */
        cosUrl = await this.uploadService.uploadFileFromUrl({ filename, url });
        console.log(this.i18n.t('common.imageSaveComplete'), cosUrl);
      }
      /* 记录图片信息 */
      const logInfo = {
        curIp: getClientIp(req),
        userId: req.user.id,
        type: DeductionKey.PAINT_TYPE,
        prompt,
        answer: cosUrl,
        model: 'mj',
        extend: this.removeEmoji(JSON.stringify(enlargeImgInfo)),
        message_id,
        upscaleId: id,
        variationId: id,
        action: 'enlarge',
        orderId: params.orderId,
        isSaveImg: !Number(mjNotSaveImg) || Number(mjNotSaveImg) === 0,
        fileInfo: JSON.stringify({ width, height, size, filename, cosUrl }),
      };
      await this.chatLogService.saveChatLog(logInfo);
      return cosUrl;
    } catch (error) {
      console.log('error: ', error);
      this.queueCount--;
      this.queueCount < 0 && (this.queueCount = 0);

      console.log(this.i18n.t('common.enlargeImageTaskInterruptedQueueDecrease'), this.queueCount);
      throw new HttpException(error.response, HttpStatus.BAD_REQUEST);
    }
  }

  /* 对单张图片变换 v: variation: 在基础上进行延伸变化 */
  async variationSingleImg(body: MjTransformImgDto, req: Request) {
    if (this.queueCount >= 3) {
      throw new HttpException(this.i18n.t('common.drawingTaskQueueFull'), HttpStatus.BAD_REQUEST);
    }
    await this.checkAuth(req);
    await this.checkRateLimit(req);
    this.queueCount++;
    const userId = req.user.id;
    console.log(this.i18n.t('common.userStartTransformImageQueueIncrease', { args: { userId } }), this.queueCount);
    const { message_id, orderId } = body;
    try {
      const historyLog = await this.chatLogEntity.findOne({ where: { message_id } });
      if (!historyLog) {
        throw new HttpException(this.i18n.t('common.imageNotExistInHistoryForTransform'), HttpStatus.BAD_REQUEST);
      }
      const { prompt, extend } = historyLog;
      let historyDetailDrawInfo: any = null;
      try {
        historyDetailDrawInfo = JSON.parse(extend);
      } catch (error) {
        historyDetailDrawInfo = [];
      }
      const { components = [] } = historyDetailDrawInfo;
      if (!components.length) {
        throw new HttpException(this.i18n.t('common.noDrawingInfoForImageTransform'), HttpStatus.BAD_REQUEST);
      }
      /* components数组 第一项 有五个数据 分别对应1-4的图片所需参数和重新绘制参数  第二项则是对应变换的四张图  */
      const currentImgComponent = components[1]['components'][orderId - 1];
      const { custom_id } = currentImgComponent;
      /* 比对结果前拿到老的变换过图片的id  因为他们prompt是一样的 需要排除已经获取过的id */
      const historyVariationLog = await this.chatLogEntity.find({ where: { variationId: Not(IsNull()), prompt: Like(`%${prompt}%`) } });
      const historyVariationIds = historyVariationLog.map((item) => item.variationId);
      /* 拿到所需参数 */
      const params = { message_id, custom_id, prompt, orderId };
      await this.sendSmInteractions(params);
      const variationImgInfo = await this.pollForVariationResult(params, historyVariationIds);
      this.queueCount--;
      this.queueCount < 0 && (this.queueCount = 0);

      console.log(this.i18n.t('common.transformImageTaskEndQueueDecrease'), this.queueCount);
      const { id, content, channel_id, attachments = [], timestamp } = variationImgInfo;
      /* 拿到结果 存入腾讯云换新的url */
      if (!attachments.length || !attachments[0].url) {
        throw new HttpException(this.i18n.t('common.failedToTransformCurrentImage'), HttpStatus.BAD_REQUEST);
      }
      const { filename, url, width, height, size } = attachments[0];
      /* 将图片存入cos */
      const mjNotSaveImg = this.globalConfigService.getConfigs(['mjNotSaveImg']);
      let cosUrl = '';
      if (!Number(mjNotSaveImg) || Number(mjNotSaveImg) === 0) {
        cosUrl = await this.uploadService.uploadFileFromUrl({ filename, url });
        console.log(this.i18n.t('common.imageSaveComplete'), cosUrl);
      }
      /* 记录图片信息 */
      const logInfo = {
        curIp: getClientIp(req),
        userId: req.user.id,
        type: DeductionKey.PAINT_TYPE,
        prompt,
        answer: cosUrl,
        model: 'mj',
        group: 1,
        extend: this.removeEmoji(JSON.stringify(variationImgInfo)),
        message_id: id, // 存自己的id才能在对变体图片放大的时候找到自己
        upscaleId: id,
        variationId: id, // 变换图片的id 后续在比对中排除就可以拿到最新的变化信息了
        action: 'enlarge',
        orderId: params.orderId,
        isSaveImg: !Number(mjNotSaveImg) || Number(mjNotSaveImg) === 0,
        fileInfo: JSON.stringify({ width, height, size, filename, cosUrl }),
      };
      await this.chatLogService.saveChatLog(logInfo);
      return cosUrl;
    } catch (error) {
      console.log('error: ', error);
      this.queueCount--;
      this.queueCount < 0 && (this.queueCount = 0);

      console.log(this.i18n.t('common.transformImageTaskInterruptedQueueDecrease'), this.queueCount);
      throw new HttpException(error.response, HttpStatus.BAD_REQUEST);
    }
  }

  /* 发送[放大|变化]小指令 */
  async sendSmInteractions(params) {
    const { message_id, custom_id } = params;
    const { application_id, guild_id, channel_id, session_id, version, id, authorization, mjProxy } = await this.getMjDefaultParams();
    const url = mjProxy == 1 ? `http://172.247.48.137:8000/mj/draw` : 'https://discord.com/api/v9/interactions';
    // const url = 'https://discord.com/api/v9/interactions';
    const headers = { authorization };
    const body = {
      type: 3,
      guild_id,
      channel_id,
      message_flags: 0,
      message_id,
      application_id,
      session_id,
      data: {
        component_type: 2,
        custom_id,
      },
    };
    try {
      await axios.post(url, body, { headers });
      console.log(this.i18n.t('common.drawingInstructionComplete'));
    } catch (error) {
      console.log('error: ', error);
      throw new HttpException(this.i18n.t('common.failedToEnlargeSingleImage'), HttpStatus.BAD_REQUEST);
    }
  }

  /* 轮询查看放大的图片结果 */
  async pollForUpscaleResult(params, histroyMessageIds) {
    const { message_id, custom_id, prompt, orderId } = params;
    let enlargeImgDetail = null;
    let pollingCount = 0;

    while (!enlargeImgDetail && pollingCount < 10) {
      try {
        const startTime = Date.now();
        const messageList = await this.queryMessageList();
        const pollingCountPlus = pollingCount + 1;
        const messageLength = messageList.length;
        console.log(this.i18n.t('common.pollingQueryStart', { args: { pollingCountPlus, messageLength } }));
        if (messageList && messageList.length) {
          enlargeImgDetail = await this.findCurrentEnlargeImgResult(messageList, params, histroyMessageIds);
        }
        const elapsedTime = Date.now() - startTime;
        const nextPollingDelay = 3000;
        await this.sleep(Math.max(nextPollingDelay - elapsedTime, 0));
        pollingCount++;
      } catch (error) {
        const errorMessage = error.message;
        console.error(this.i18n.t('common.errorDuringQuery', { args: { errorMessage } }));
      }
    }
    return enlargeImgDetail;
  }

  /* 轮询查看变换图片结果 */
  async pollForVariationResult(params, historyVariationIds) {
    const { message_id, custom_id, prompt, orderId } = params;
    console.log(this.i18n.t('common.startPollingTransformImageResult'));
    let variationImgDetail = null;
    let pollingCount = 0;
    while (!variationImgDetail && pollingCount < 10) {
      try {
        const pollingCountPlus = pollingCount + 1;
        console.log(this.i18n.t('common.pollingQueryTransformImageStart', { args: { pollingCountPlus } }));
        const startTime = Date.now();
        const messageList = await this.queryMessageList();
        if (messageList && messageList.length) {
          variationImgDetail = await this.findCurrentVariationImgResult(messageList, params, historyVariationIds);
        }
        const elapsedTime = Date.now() - startTime;
        const nextPollingDelay = 8000;
        await this.sleep(Math.max(nextPollingDelay - elapsedTime, 0));
        pollingCount++;
      } catch (error) {
        const errorMessage = error.message;
        console.error(this.i18n.t('common.errorDuringQuery', { args: { errorMessage } }));
      }
    }

    if (!variationImgDetail) {
      throw new HttpException(this.i18n.t('common.transformImageTimeout'), HttpStatus.BAD_REQUEST);
    }
    return variationImgDetail;
  }

  /* 比对找到放大图片的地址作为返回结果 */
  async findCurrentEnlargeImgResult(messageList, params, histroyMessageIds) {
    const { message_id, custom_id, prompt, orderId } = params;
    const randomId = prompt.substring(0, 12);
    console.log(this.i18n.t('common.enlargeImageId'), randomId);
    const enlargeImgDetail = messageList.find((item) => {
      const { content } = item;
      if (!this.extractContent(content)) return false;
      const { prompt, order } = this.extractContent(content);
      return prompt.includes(randomId) && params.orderId === order && !histroyMessageIds.includes(item.id);
    });
    return enlargeImgDetail;
  }

  /* 比对找到变换的图片地址作为返回结果 */
  async findCurrentVariationImgResult(messageList, params, historyVariationIds) {
    const { message_id, custom_id, prompt, orderId } = params;
    const randomId = prompt.substring(0, 12);
    const variationImgDetail = messageList.find((item) => {
      const { content } = item;
      const promptMatch = content.match(/\*\*(.+?)\*\*/);
      const prompt = promptMatch ? promptMatch[1] : '';
      if (!prompt) return false;
      return prompt.includes(randomId) && !historyVariationIds.includes(item.id);
    });
    return variationImgDetail;
  }

  /* 发送绘画指令 */
  async sendDrawInteractions(prompt, histroyMessageIds, randomId) {
    /* 发送指令前判断一次 历史绘图记录是不是已经存在了 可能会因为错误导致指令发送 图片绘制了 但是之前没有拿到结果 */
    const messageList = await this.queryMessageList(); // 获取最新的已有内容
    const drawDetail = await this.findCurrentPromptResult(messageList, randomId, histroyMessageIds);
    if (drawDetail) {
      console.log(this.i18n.t('common.returnHistoryInfo'), drawDetail);
      return drawDetail;
    }
    const { application_id, guild_id, channel_id, session_id, version, id, authorization, mjProxy } = await this.getMjDefaultParams();
    const payloadJson = {
      type: 2,
      application_id,
      guild_id,
      channel_id,
      session_id,
      data: { version, id, name: 'imagine', type: 1, options: [{ type: 3, name: 'prompt', value: prompt }], attachments: [] },
    };
    try {
      // const url = 'https://discord.com/api/v9/interactions';
      /* 发送绘制指令 */
      const url = mjProxy == 1 ? `http://172.247.48.137:8000/mj/draw` : 'https://discord.com/api/v9/interactions';
      const headers = { authorization };
      const res = await axios.post(url, payloadJson, { headers });
      console.log(this.i18n.t('common.sendDrawingInstructionResult'), res.data);
      return false;
    } catch (error) {
      console.log('axios: ', error);
      throw new HttpException(this.i18n.t('common.drawingRequestFailedQueueing'), HttpStatus.BAD_REQUEST);
    }
  }

  /* 传入prompt定时轮询返回结果 */
  async pollForResult(prompt, histroyMessageIds, randomId) {
    console.log(this.i18n.t('common.startQueryDrawingResultPolling'));
    const startTime = Date.now();
    try {
      /* 最多轮询13次 前六十秒12秒一次共五次 后面五秒一次  最多100s  超过就是超时  */
      const MAX_POLLING_COUNT = 13;
      const SHORT_INTERVAL = 12000; // 短轮询间隔，单位：毫秒
      const LONG_INTERVAL = 5000; // 长轮询间隔，单位：毫秒
      const TIME_THRESHOLD = 60 * 1000; // 时间阈值，单位：毫秒
      let pollingCount = 0;
      let isLongInterval = false;
      let drawDetail = null;
      while (!drawDetail && pollingCount < MAX_POLLING_COUNT) {
        const pollingCountPlus = pollingCount + 1;
        console.log(this.i18n.t('common.startQuery', { args: { pollingCountPlus } }));
        if (Date.now() - startTime >= TIME_THRESHOLD) {
          isLongInterval = true;
        }
        await this.sleep(isLongInterval ? LONG_INTERVAL : SHORT_INTERVAL); // 等待指定的时间后继续轮询
        const messageList = await this.queryMessageList(); // 获取最新的已有内容
        drawDetail = await this.findCurrentPromptResult(messageList, randomId, histroyMessageIds);
        pollingCount++;
      }
      if (!drawDetail) {
        throw new HttpException(this.i18n.t('common.drawingTimeout'), HttpStatus.BAD_REQUEST);
      }
      const endTime = Date.now();
      const calcTime = Math.floor((endTime - startTime) / 1000);
      console.log(this.i18n.t('common.drawingTime', { args: { calcTime } }));
      return drawDetail;
    } catch (err) {
      console.error(err.message);
      throw new HttpException(this.i18n.t('common.networkError'), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /* 比对当前列表中是否存在我们正在绘制的图片prompt是否已经绘制完成 histroyMessageIds是历史相同prompt生成的  有的话排除这些 */
  async findCurrentPromptResult(data, randomId, histroyMessageIds) {
    if (!data || !data.length) return;
    console.log(this.i18n.t('common.randomId'), randomId);
    const matchingItem = data.find((item) => {
      const { attachments = [], content, edited_timestamp } = item;
      return content.includes(randomId) && attachments.length > 0 && !edited_timestamp && !histroyMessageIds.includes(item.id);
    });
    return matchingItem || null;
  }

  /* 查询绘画的所有列表 */
  async queryMessageList() {
    try {
      const { application_id, guild_id, channel_id, session_id, version, id, authorization, mjProxy } = await this.getMjDefaultParams();
      const url =
        mjProxy == 1
          ? `http://172.247.48.137:8000/mj/list?channel_id=${channel_id}`
          : `https://discord.com/api/v9/channels/${channel_id}/messages?limit=50`;
      const headers = { authorization };
      const response = await axios.get(url, { headers });
      return response.data;
    } catch (error) {
      console.log('axios get: ', error);
      throw new HttpException(this.i18n.t('common.queryFailed2'), HttpStatus.BAD_REQUEST);
    }
  }

  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /* 匹配放大的单张图片的操作 */
  extractContent(str: string): { prompt: string; order: number } | null {
    const promptMatch = str.match(/\*\*(.+?)\*\*/);
    const orderMatch = str.match(/- Image #(\d+)/);
    if (!promptMatch || !orderMatch) {
      return null;
    }
    const prompt = promptMatch[1];
    const order = parseInt(orderMatch[1]);
    return { prompt, order };
  }

  async getMjDefaultParams() {
    const configs = await this.globalConfigService.getConfigs([
      'mjId',
      'mjApplicationId',
      'mjGuildId',
      'mjChannelId',
      'mjSessionId',
      'mjVersion',
      'mjAuthorization',
      'mjRateLimit',
      'mjProxy',
    ]);
    const params = {
      application_id: configs.mjApplicationId,
      guild_id: configs.mjGuildId,
      channel_id: configs.mjChannelId,
      session_id: configs.mjSessionId,
      version: configs.mjVersion,
      id: configs.mjId,
      authorization: configs.mjAuthorization,
      mjRateLimit: configs.mjRateLimit,
      mjProxy: configs.mjProxy || 0,
    };
    return params;
  }

  /* 去除字符串表情 */
  removeEmoji(str) {
    const regex = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
    return str.replace(regex, '');
  }

  async checkAuth(req) {
    const m = await this.balanceEntity.findOne({ where: { userId: req.user.id } });
    const { id, balance } = m;
    if (!balance || m?.balance < 1) {
      throw new HttpException(this.i18n.t('common.noBalance'), HttpStatus.BAD_REQUEST);
    }
  }

  async checkFree(req) {
    const { id, role } = req.user;
    if (!this.freeQueueUsers[id]) {
      this.freeQueueUsers[id] = 1;
    } else {
      this.freeQueueUsers[id] = this.freeQueueUsers[id] + 1;
    }
    console.log(this.i18n.t('common.userUsageCount', { args: { id } }), this.freeQueueUsers[id]);
  }

  async checkRateLimit(req: Request) {
    const { id, role } = req.user;
    if (['admin', 'super'].includes(role)) return true;
    const { mjRateLimit } = await this.getMjDefaultParams();
    if (this.rateLimits[id]) {
      const val = this.rateLimits[id];
      if (val > Date.now()) {
        console.log(this.i18n.t('common.userRequestTooFrequent', { args: { id } }));
        throw new HttpException(this.i18n.t('common.rateLimit', { args: { mjRateLimit } }), HttpStatus.BAD_REQUEST);
      } else {
        this.rateLimits[id] = Date.now() + Number(mjRateLimit) * 1000;
      }
    } else {
      const timeSpace = Date.now();
      this.rateLimits[id] = timeSpace + 1000 * Number(mjRateLimit);
    }
  }

  // 扣除一次余额
  async deductBalance(req: Request) {
    await this.balanceEntity
      .createQueryBuilder()
      .update(BalanceEntity)
      .set({ balance: () => 'balance - 1' })
      .where('userId = :userId', { userId: req.user.id })
      .execute();
  }

  /* test */
  async test() {
    return 1;
  }
}
