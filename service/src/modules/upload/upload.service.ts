import { HttpException, HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as TENCENTCOS from 'cos-nodejs-sdk-v5';
import * as ALIOSS from 'ali-oss';
import cosConfig from '@/config/cos';
import axios from 'axios';
import * as streamToBuffer from 'stream-to-buffer';
import { createRandomUid, removeSpecialCharacters } from '@/common/utils';
import { GlobalConfigService } from '../globalConfig/globalConfig.service';
import * as FormData from 'form-data';
import { I18n, I18nContext, I18nService } from 'nestjs-i18n';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService implements OnModuleInit {
  constructor(private readonly globalConfigService: GlobalConfigService, @I18n() private readonly i18n: I18nService) {}
  private tencentCos: any;

  onModuleInit() {}

  async uploadFile(file) {
    const { filename: name, originalname, buffer, dir = 'ai', mimetype } = file;
    const fileType = mimetype ? mimetype.split('/')[1] : '';
    const filename = originalname || name;
    Logger.debug(this.i18n.t('common.prepareUploadFile', { args: { filename, fileType } }), 'UploadService');

    const {
      tencentCosStatus = 0,
      aliOssStatus = 0,
      cheveretoStatus = 0,
    } = await this.globalConfigService.getConfigs(['tencentCosStatus', 'aliOssStatus', 'cheveretoStatus']);

    Logger.debug(`上传配置状态 - 腾讯云: ${tencentCosStatus}, 阿里云: ${aliOssStatus}, Chevereto: ${cheveretoStatus}`, 'UploadService');

    // 로컬서버 업로드 추가
    // if (!Number(tencentCosStatus) && !Number(aliOssStatus) && !Number(cheveretoStatus)) {
    //   throw new HttpException(this.i18n.t('common.configureUploadMethod'), HttpStatus.BAD_REQUEST);
    // }
    //
    try {
      if (Number(tencentCosStatus)) {
        Logger.debug(this.i18n.t('common.usingTencentCOS'), 'UploadService');
        return await this.uploadFileByTencentCos({ filename, buffer, dir, fileType });
      }
      if (Number(aliOssStatus)) {
        Logger.debug(this.i18n.t('common.usingAliyunOSS'), 'UploadService');
        return await this.uploadFileByAliOss({ filename, buffer, dir, fileType });
      }
      if (Number(cheveretoStatus)) {
        Logger.debug(this.i18n.t('common.usingChevereto'), 'UploadService');
        const { filename, buffer: fromBuffer, dir } = file;
        return await this.uploadFileByChevereto({ filename, buffer: fromBuffer.toString('base64'), dir, fileType });
      } else {
        Logger.debug(this.i18n.t('common.usingLocalUpload'), 'UploadService');
        return await this.uploadFileToLocalServer({ filename, buffer, dir, fileType });
      }
    } catch (error) {
      Logger.error(this.i18n.t('common.uploadFailed'), 'UploadService');
      throw error; // 重新抛出异常，以便调用方可以处理
    }
  }

  async getUploadType() {
    const {
      tencentCosStatus = 0,
      aliOssStatus = 0,
      cheveretoStatus = 0,
    } = await this.globalConfigService.getConfigs(['tencentCosStatus', 'aliOssStatus', 'cheveretoStatus']);
    if (Number(tencentCosStatus)) {
      return 'tencent';
    }
    if (Number(aliOssStatus)) {
      return 'ali';
    }
    if (Number(cheveretoStatus)) {
      return 'chevereto';
    } else {
      return 'local';
    }
  }

  async uploadFileFromUrl({ filename, url, dir = 'mj' }) {
    dir = process.env.ISDEV ? 'mjdev' : dir;
    const {
      tencentCosStatus = 0,
      aliOssStatus = 0,
      cheveretoStatus = 0,
    } = await this.globalConfigService.getConfigs(['tencentCosStatus', 'aliOssStatus', 'cheveretoStatus']);

    if (!Number(tencentCosStatus) && !Number(aliOssStatus) && !Number(cheveretoStatus)) {
      throw new HttpException(this.i18n.t('common.configureUploadMethod'), HttpStatus.BAD_REQUEST);
    }
    if (Number(tencentCosStatus)) {
      return this.uploadFileByTencentCosFromUrl({ filename, url, dir });
    }
    if (Number(aliOssStatus)) {
      const res = await this.uploadFileByAliOssFromUrl({ filename, url, dir });
      return res;
    }
    if (Number(cheveretoStatus)) {
      return await this.uploadFileByCheveretoFromUrl({ filename, url, dir });
    }
  }

  async uploadFileToLocalServer({ filename, buffer, dir, fileType }) {
    try {
      // Logger.debug(`uploadFileToLocalServer 시작 - 파일명: ${filename}, 디렉토리: ${dir}, 파일 타입: ${fileType}`, 'UploadService');

      const { localUploadPath, baseUrl } = await this.getUploadConfig('local');
      // Logger.debug(`설정 로드 완료 - 로컬 업로드 경로: ${localUploadPath}, 베이스 URL: ${baseUrl}`, 'UploadService');

      const fullDir = path.join(localUploadPath, dir);
      // Logger.debug(`전체 디렉토리 경로: ${fullDir}`, 'UploadService');

      // 디렉토리가 없으면 생성
      if (!fs.existsSync(fullDir)) {
        // Logger.debug(`디렉토리가 존재하지 않음. 생성 시도: ${fullDir}`, 'UploadService');
        fs.mkdirSync(fullDir, { recursive: true });
        // Logger.debug(`디렉토리 생성 완료: ${fullDir}`, 'UploadService');
      } else {
        // Logger.debug(`디렉토리가 이미 존재함: ${fullDir}`, 'UploadService');
      }

      const savedFilename = filename || `${createRandomUid()}.${fileType}`;
      const fullPath = path.join(fullDir, savedFilename);
      // Logger.debug(`저장될 파일의 전체 경로: ${fullPath}`, 'UploadService');

      await fs.promises.writeFile(fullPath, buffer);
      // Logger.debug(`파일 쓰기 완료: ${fullPath}`, 'UploadService');

      // URL 생성
      const fileUrl = new URL(path.join('upload', dir, savedFilename), baseUrl).toString();
      // Logger.debug(`생성된 파일 URL: ${fileUrl}`, 'UploadService');

      // Logger.debug(`파일 업로드 성공: ${fileUrl}`, 'UploadService');
      return fileUrl;
    } catch (error) {
      // Logger.error(`로컬 파일 업로드 실패: ${error.message}`, 'UploadService');
      // Logger.error(`스택 트레이스: ${error.stack}`, 'UploadService');
      throw new HttpException(this.i18n.t('common.uploadFailedLocal', { args: { error: error.message } }), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /* 通过腾讯云上传图片 */
  async uploadFileByTencentCos({ filename, buffer, dir, fileType }) {
    const { Bucket, Region, SecretId, SecretKey } = await this.getUploadConfig('tencent');
    this.tencentCos = new TENCENTCOS({ SecretId, SecretKey, FileParallelLimit: 10 });
    try {
      return new Promise(async (resolve, reject) => {
        const type = fileType || 'png';
        this.tencentCos.putObject(
          {
            Bucket: removeSpecialCharacters(Bucket),
            Region: removeSpecialCharacters(Region),
            Key: `${dir}/${filename || `${createRandomUid()}.${fileType}`}`,
            StorageClass: 'STANDARD',
            Body: buffer,
          },
          async (err, data) => {
            if (err) {
              console.log('cos -> err: ', err);
              return reject(err);
            }
            let locationUrl = data.Location.replace(/^(http:\/\/|https:\/\/|\/\/|)(.*)/, 'https://$2');
            const { acceleratedDomain } = await this.getUploadConfig('tencent');
            if (acceleratedDomain) {
              locationUrl = locationUrl.replace(/^(https:\/\/[^/]+)(\/.*)$/, `https://${acceleratedDomain}$2`);
              console.log(this.i18n.t('common.globalAccelerationEnabled'), locationUrl);
            }
            return resolve(locationUrl);
          },
        );
      });
    } catch (error) {
      console.log('error: ', error);
      throw new HttpException(this.i18n.t('common.uploadFailedTencent'), HttpStatus.BAD_REQUEST);
    }
  }

  //
  /* 腾讯云通过url上传mj图片 */
  async uploadFileByTencentCosFromUrl({ filename, url, dir }) {
    const { Bucket, Region, SecretId, SecretKey } = await this.getUploadConfig('tencent');
    this.tencentCos = new TENCENTCOS({ SecretId, SecretKey, FileParallelLimit: 10 });
    try {
      const proxyMj = (await this.globalConfigService.getConfigs(['mjProxy'])) || 0;

      const buffer = await this.getBufferFromUrl(url);
      return await this.uploadFileByTencentCos({ filename, buffer, dir, fileType: '' });
    } catch (error) {
      console.log('TODO->error:  ', error);
      throw new HttpException(this.i18n.t('common.uploadFailedTencentUrl'), HttpStatus.BAD_REQUEST);
    }
  }

  /* 通过阿里云上传图片 */
  async uploadFileByAliOss({ filename, buffer, dir, fileType = 'png' }) {
    const { region, bucket, accessKeyId, accessKeySecret } = await this.getUploadConfig('ali');
    const client = new ALIOSS({ region: removeSpecialCharacters(region), accessKeyId, accessKeySecret, bucket: removeSpecialCharacters(bucket) });
    try {
      console.log(this.i18n.t('common.startUploadAliyun'));
      return new Promise((resolve, reject) => {
        client
          .put(`${dir}/${filename || `${createRandomUid()}.${fileType}`}`, buffer)
          .then((result) => {
            resolve(result.url);
          })
          .catch((err) => {
            reject(err);
          });
      });
    } catch (error) {
      throw new HttpException(this.i18n.t('common.uploadFailedAliyun'), HttpStatus.BAD_REQUEST);
    }
  }

  /* 阿里云通过url上传mj图片 */
  async uploadFileByAliOssFromUrl({ filename, url, dir }) {
    const { region, bucket, accessKeyId, accessKeySecret } = await this.getUploadConfig('ali');
    const client = new ALIOSS({ region, accessKeyId, accessKeySecret, bucket });
    try {
      const proxyMj = (await this.globalConfigService.getConfigs(['mjProxy'])) || 0;
      if (Number(proxyMj) === 1) {
        const data = { url, cosParams: { region, bucket, accessKeyId, accessKeySecret }, cosType: 'aliyun' };
        const mjProxyUrl = (await this.globalConfigService.getConfigs(['mjProxyUrl'])) || 'http://172.247.48.137:8000';
        const res = await axios.post(`${mjProxyUrl}/mj/replaceUpload`, data);
        if (!res?.data) throw new HttpException(this.i18n.t('common.uploadFailedAliyunUrl'), HttpStatus.BAD_REQUEST);
        return res.data;
      } else {
        const buffer = await this.getBufferFromUrl(url);
        return await this.uploadFileByAliOss({ filename, buffer, dir });
      }
    } catch (error) {
      throw new HttpException(this.i18n.t('common.uploadFailedAliyunUrl'), HttpStatus.BAD_REQUEST);
    }
  }

  /* 通过三方图床上传图片 */
  async uploadFileByChevereto({ filename = '', buffer, dir = 'ai', fileType = 'png' }) {
    const { key, uploadPath } = await this.getUploadConfig('chevereto');
    const url = uploadPath.endsWith('/') ? uploadPath.slice(0, -1) : uploadPath;
    const formData = new FormData();
    formData.append('source', buffer);
    formData.append('key', key);
    try {
      const res = await axios.post(url, formData, {
        headers: { 'X-API-Key': key },
      });
      if (res?.status === 200) {
        return res.data.image.url;
      } else {
        console.log('Chevereto ---> res', res?.data.code, res?.data.error.message);
        Logger.error(this.i18n.t('common.uploadFailedChevereto'), JSON.stringify(res.data));
      }
    } catch (error) {
      console.log('error: ', error);
      throw new HttpException(this.i18n.t('common.uploadFailedCheveretoBuffer'), HttpStatus.BAD_REQUEST);
    }
  }

  /* 通过Url直接上传到图床 */
  async uploadFileByCheveretoFromUrl({ filename, url, dir }) {
    try {
      const proxyMj = (await this.globalConfigService.getConfigs(['mjProxy'])) || 0;
      if (Number(proxyMj) === 1) {
        const { key, uploadPath } = await this.getUploadConfig('chevereto');
        const formatUploadPath = uploadPath.endsWith('/') ? uploadPath.slice(0, -1) : uploadPath;
        const data = { cosType: 'chevereto', url, cosParams: { key, uploadPath: formatUploadPath } };
        const mjProxyUrl = (await this.globalConfigService.getConfigs(['mjProxyUrl'])) || 'http://172.247.48.137:8000';
        const res = await axios.post(`${mjProxyUrl}/mj/replaceUpload`, data);
        if (!res.data) throw new HttpException(this.i18n.t('common.uploadFailedCheveretoUrl'), HttpStatus.BAD_REQUEST);
        return res.data;
      } else {
        const buffer = await this.getBufferFromUrl(url);
        return await this.uploadFileByChevereto({ filename, buffer, dir });
      }
    } catch (error) {
      console.log('error: ', error);
      throw new HttpException(error.response, HttpStatus.BAD_REQUEST);
    }
  }

  /* 获取cos上传配置 */
  async getUploadConfig(type) {
    if (type === 'ali') {
      const {
        aliOssRegion: region,
        aliOssBucket: bucket,
        aliOssAccessKeyId: accessKeyId,
        aliOssAccessKeySecret: accessKeySecret,
      } = await this.globalConfigService.getConfigs(['aliOssRegion', 'aliOssBucket', 'aliOssAccessKeyId', 'aliOssAccessKeySecret']);

      return { region, bucket, accessKeyId, accessKeySecret };
    }
    if (type === 'tencent') {
      const {
        cosBucket: Bucket,
        cosRegion: Region,
        cosSecretId: SecretId,
        cosSecretKey: SecretKey,
        tencentCosAcceleratedDomain: acceleratedDomain,
      } = await this.globalConfigService.getConfigs(['cosBucket', 'cosRegion', 'cosSecretId', 'cosSecretKey', 'tencentCosAcceleratedDomain']);
      return { Bucket, Region, SecretId, SecretKey, acceleratedDomain };
    }
    if (type === 'chevereto') {
      const { cheveretoKey: key, cheveretoUploadPath: uploadPath } = await this.globalConfigService.getConfigs([
        'cheveretoKey',
        'cheveretoUploadPath',
      ]);
      return { key, uploadPath };
    }
    if (type === 'local') {
      // const { localUploadPath } = await this.globalConfigService.getConfigs(['localUploadPath']);
      // 하드코딩된 로컬 업로드 경로
      const appRootDir = process.cwd();
      const localUploadPath = path.join(appRootDir, 'public', 'upload'); // 업로드 경로 생성

      const host = process.env.NINE_AI_HOST || 'http://localhost:8080'; // 기본 호스트 설정
      const baseUrl = new URL('/upload', host).toString(); // URL 생성

      return { localUploadPath, baseUrl };
    }
  }

  async test() {
    const params = {
      filename: 'mjtest.png',
      dir: 'mj',
      url: 'https://cdn.discordapp.com/attachments/1097409128491651135/1169910551275638855/snine_60b5c001b_A_young_girl_smiles_brightly_in_the_pure_blue_f_8a41fe5f-5101-4c1e-b948-a748a0583577.png?ex=65571f1b&is=6544aa1b&hm=b82f2d88224eb7942e24c63a8e519c7693de12a2b96daa0f327dfb8f691b1480&',
    };
    const res = await this.uploadFileFromUrl(params);
    console.log('res: ', res);
    return res;
  }

  /* 将MJ图片地址转为buffer */
  async getBufferFromUrl(url) {
    const proxyMj = (await this.globalConfigService.getConfigs(['mjProxy'])) || 0;
    const response = await axios.get(url, { responseType: 'stream' });
    return new Promise((resolve, reject) => {
      streamToBuffer(response.data, (err, buffer) => {
        if (err) {
          throw new HttpException(this.i18n.t('common.getImageResourceFailed'), HttpStatus.BAD_REQUEST);
        } else {
          resolve(buffer);
        }
      });
    });
  }
}
