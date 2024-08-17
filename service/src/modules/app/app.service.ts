import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AppCatsEntity } from './appCats.entity';
import { In, IsNull, Like, MoreThan, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCatsDto } from './dto/createCats.dto';
import { DeleteCatsDto } from './dto/deleteCats.dto';
import { UpdateCatsDto } from './dto/updateCats.dto';
import { QuerCatsDto } from './dto/queryCats.dto';
import { CreateAppDto } from './dto/createApp.dto';
import { UpdateAppDto } from './dto/updateApp.dto';
import { OperateAppDto } from './dto/deleteApp.dto';
import { QuerAppDto } from './dto/queryApp.dto';
import { AppEntity } from './app.entity';
import { CollectAppDto } from './dto/collectApp.dto';
import { UserAppsEntity } from './userApps.entity';
import { Request } from 'express';
import { CustomAppDto } from './dto/custonApp.dto';
import { I18n, I18nContext, I18nService } from 'nestjs-i18n';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(AppCatsEntity)
    private readonly appCatsEntity: Repository<AppCatsEntity>,
    @InjectRepository(AppEntity)
    private readonly appEntity: Repository<AppEntity>,
    @InjectRepository(UserAppsEntity)
    private readonly userAppsEntity: Repository<UserAppsEntity>,
    @I18n() private readonly i18n: I18nService,
  ) {}

  async createAppCat(body: CreateCatsDto) {
    const { name } = body;
    const c = await this.appCatsEntity.findOne({ where: { name } });
    if (c) {
      throw new HttpException(this.i18n.t('common.categoryNameExists'), HttpStatus.BAD_REQUEST);
    }
    return await this.appCatsEntity.save(body);
  }

  async delAppCat(body: DeleteCatsDto) {
    const { id } = body;
    const c = await this.appCatsEntity.findOne({ where: { id } });
    if (!c) {
      throw new HttpException(this.i18n.t('common.categoryNotExist'), HttpStatus.BAD_REQUEST);
    }
    const count = await this.appEntity.count({ where: { catId: id } });
    if (count > 0) {
      throw new HttpException(this.i18n.t('common.categoryHasApps'), HttpStatus.BAD_REQUEST);
    }
    const res = await this.appCatsEntity.delete(id);
    if (res.affected > 0) return this.i18n.t('common.deleteSuccess');
    throw new HttpException(this.i18n.t('common.deleteFail'), HttpStatus.BAD_REQUEST);
  }

  async updateAppCats(body: UpdateCatsDto) {
    const { id, name } = body;
    const c = await this.appCatsEntity.findOne({ where: { name, id: Not(id) } });
    if (c) {
      throw new HttpException(this.i18n.t('common.categoryNameExists'), HttpStatus.BAD_REQUEST);
    }
    const res = await this.appCatsEntity.update({ id }, body);
    if (res.affected > 0) return this.i18n.t('common.modifySuccess');
    throw new HttpException(this.i18n.t('common.modifyFail'), HttpStatus.BAD_REQUEST);
  }

  async queryOneCat(params) {
    const { id } = params;
    if (!id) {
      throw new HttpException(this.i18n.t('common.missingParams'), HttpStatus.BAD_REQUEST);
    }
    const app = await this.appEntity.findOne({ where: { id } });
    const { demoData: demo, coverImg, des, name } = app;
    return {
      demoData: demo ? demo.split('\n') : [],
      coverImg,
      des,
      name,
    };
  }

  async appCatsList(query: QuerCatsDto) {
    const { page = 1, size = 10, name, status } = query;
    const where: any = {};
    name && (where.name = Like(`%${name}%`));
    [0, 1, '0', '1'].includes(status) && (where.status = status);
    const [rows, count] = await this.appCatsEntity.findAndCount({
      where,
      order: { order: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });
    // 查出所有分类下对应的App数量
    const catIds = rows.map((item) => item.id);
    const apps = await this.appEntity.find({ where: { catId: In(catIds) } });
    const appCountMap = {};
    apps.forEach((item) => {
      if (appCountMap[item.catId]) {
        appCountMap[item.catId] += 1;
      } else {
        appCountMap[item.catId] = 1;
      }
    });
    rows.forEach((item: any) => (item.appCount = appCountMap[item.id] || 0));
    return { rows, count };
  }

  async appList(req: Request, query: QuerAppDto, orderKey = 'id') {
    const { page = 1, size = 10, name, status, catId, role } = query;
    const where: any = {};
    name && (where.name = Like(`%${name}%`));
    catId && (where.catId = catId);
    role && (where.role = role);
    status && (where.status = status);
    const [rows, count] = await this.appEntity.findAndCount({
      where,
      order: { [orderKey]: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });
    const catIds = rows.map((item) => item.catId);
    const cats = await this.appCatsEntity.find({ where: { id: In(catIds) } });
    rows.forEach((item: any) => {
      const cat = cats.find((c) => c.id === item.catId);
      item.catName = cat ? cat.name : '';
    });
    if (req?.user?.role !== 'super') {
      rows.forEach((item: any) => {
        delete item.preset;
      });
    }
    return { rows, count };
  }

  async frontAppList(req: Request, query: QuerAppDto, orderKey = 'id') {
    const { page = 1, size = 1000, name, catId, role } = query;
    const where: any = [
      { status: In([1, 4]), userId: IsNull(), public: false },
      { userId: MoreThan(0), public: true },
    ];
    const [rows, count] = await this.appEntity.findAndCount({
      where,
      order: { order: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });
    const catIds = rows.map((item) => item.catId);
    const cats = await this.appCatsEntity.find({ where: { id: In(catIds) } });
    rows.forEach((item: any) => {
      const cat = cats.find((c) => c.id === item.catId);
      item.catName = cat ? cat.name : '';
    });
    if (req?.user?.role !== 'super') {
      rows.forEach((item: any) => {
        delete item.preset;
      });
    }
    return { rows, count };
  }

  async createApp(body: CreateAppDto) {
    const { name, catId } = body;
    body.role = 'system';
    const a = await this.appEntity.findOne({ where: { name } });
    if (a) {
      throw new HttpException(this.i18n.t('common.appNameExists'), HttpStatus.BAD_REQUEST);
    }
    const c = await this.appCatsEntity.findOne({ where: { id: catId } });
    if (!c) {
      throw new HttpException(this.i18n.t('common.categoryNotExist'), HttpStatus.BAD_REQUEST);
    }
    return await this.appEntity.save(body);
  }

  async customApp(body: CustomAppDto, req: Request) {
    const { id } = req.user;
    const { name, catId, des, preset, coverImg, demoData, public: isPublic, appId } = body;
    if (appId) {
      const a = await this.appEntity.findOne({ where: { id: appId, userId: id } });
      if (!a) {
        throw new HttpException(this.i18n.t('common.editingNonexistentApp'), HttpStatus.BAD_REQUEST);
      }
      const data = { name, catId, des, preset, coverImg, demoData, public: isPublic, status: isPublic ? 3 : 1 };
      const res = await this.appEntity.update({ id: appId, userId: id }, data);
      if (res.affected) {
        return this.i18n.t('common.modifySuccess');
      } else {
        throw new HttpException(this.i18n.t('common.modifyFail'), HttpStatus.BAD_REQUEST);
      }
    }
    if (!appId) {
      const c = await this.appCatsEntity.findOne({ where: { id: catId } });
      if (!c) {
        throw new HttpException(this.i18n.t('common.categoryNotExist'), HttpStatus.BAD_REQUEST);
      }
      const a = await this.appEntity.findOne({ where: { name } });
      if (a) {
        throw new HttpException(this.i18n.t('common.appNameExists'), HttpStatus.BAD_REQUEST);
      }
      const data = { name, catId, des, preset, coverImg, status: isPublic ? 3 : 1, demoData, public: isPublic, role: 'user', userId: id };
      const res = await this.appEntity.save(data);
      const params = { appId: res.id, userId: id, appType: 'user', public: isPublic, status: isPublic ? 3 : 1, catId };
      return this.userAppsEntity.save(params);
    }
  }

  async updateApp(body: UpdateAppDto) {
    const { id, name, catId, status } = body;
    const a = await this.appEntity.findOne({ where: { name, id: Not(id) } });
    if (a) {
      throw new HttpException(this.i18n.t('common.appNameExists'), HttpStatus.BAD_REQUEST);
    }
    const c = await this.appCatsEntity.findOne({ where: { id: catId } });
    if (!c) {
      throw new HttpException(this.i18n.t('common.categoryNotExist'), HttpStatus.BAD_REQUEST);
    }
    const curApp = await this.appEntity.findOne({ where: { id } });
    if (curApp.status !== body.status) {
      await this.userAppsEntity.update({ appId: id }, { status });
    }
    const res = await this.appEntity.update({ id }, body);
    if (res.affected > 0) return this.i18n.t('common.modifyAppInfoSuccess');
    throw new HttpException(this.i18n.t('common.modifyAppInfoFail'), HttpStatus.BAD_REQUEST);
  }

  async delApp(body: OperateAppDto) {
    const { id } = body;
    const a = await this.appEntity.findOne({ where: { id } });
    if (!a) {
      throw new HttpException(this.i18n.t('common.appNotExist'), HttpStatus.BAD_REQUEST);
    }
    const useApp = await this.userAppsEntity.count({ where: { appId: id } });
    if (useApp > 0) {
      throw new HttpException(this.i18n.t('common.appInUse'), HttpStatus.BAD_REQUEST);
    }
    const res = await this.appEntity.delete(id);
    if (res.affected > 0) return this.i18n.t('common.deleteAppSuccess');
    throw new HttpException(this.i18n.t('common.deleteAppFail'), HttpStatus.BAD_REQUEST);
  }

  async auditPass(body: OperateAppDto) {
    const { id } = body;
    const a = await this.appEntity.findOne({ where: { id, status: 3 } });
    if (!a) {
      throw new HttpException(this.i18n.t('common.appNotExist'), HttpStatus.BAD_REQUEST);
    }
    await this.appEntity.update({ id }, { status: 4 });
    /* 同步变更useApp status  */
    await this.userAppsEntity.update({ appId: id }, { status: 4 });
    return this.i18n.t('common.appApproved');
  }

  async auditFail(body: OperateAppDto) {
    const { id } = body;
    const a = await this.appEntity.findOne({ where: { id, status: 3 } });
    if (!a) {
      throw new HttpException(this.i18n.t('common.appNotExist'), HttpStatus.BAD_REQUEST);
    }
    await this.appEntity.update({ id }, { status: 5 });
    /* 同步变更useApp status  */
    await this.userAppsEntity.update({ appId: id }, { status: 5 });
    return this.i18n.t('common.appRejected');
  }

  async delMineApp(body: OperateAppDto, req: Request) {
    const { id } = body;
    const a = await this.appEntity.findOne({ where: { id, userId: req.user.id } });
    if (!a) {
      throw new HttpException(this.i18n.t('common.operatingNonexistentResource'), HttpStatus.BAD_REQUEST);
    }
    /* 删除app */
    await this.appEntity.delete(id);
    /* 删除关联的useApp */
    await this.userAppsEntity.delete({ appId: id, userId: req.user.id });
    return this.i18n.t('common.deleteAppSuccess2');
  }

  async collect(body: CollectAppDto, req: Request) {
    const { appId } = body;
    const { id: userId } = req.user;
    const historyApp = await this.userAppsEntity.findOne({ where: { appId, userId } });
    if (historyApp) {
      const r = await this.userAppsEntity.delete({ appId, userId });
      if (r.affected > 0) {
        return this.i18n.t('common.unfavoriteSuccess');
      } else {
        throw new HttpException(this.i18n.t('common.unfavoriteFail'), HttpStatus.BAD_REQUEST);
      }
    }
    const app = await this.appEntity.findOne({ where: { id: appId } });
    const { id, role: appRole, catId } = app;
    const collectInfo = { userId, appId: id, catId, appRole, public: true, status: 1 };
    await this.userAppsEntity.save(collectInfo);
    return this.i18n.t('common.addedToWorkspace');
  }

  async mineApps(req: Request, query = { page: 1, size: 30 }) {
    const { id } = req.user;
    const { page = 1, size = 30 } = query;
    const [rows, count] = await this.userAppsEntity.findAndCount({
      where: { userId: id, status: In([1, 3, 4, 5]) },
      order: { id: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });

    const appIds = rows.map((item) => item.appId);
    const appsInfo = await this.appEntity.find({ where: { id: In(appIds) } });
    rows.forEach((item: any) => {
      const app = appsInfo.find((c) => c.id === item.appId);
      item.appName = app ? app.name : '';
      item.appRole = app ? app.role : '';
      item.appDes = app ? app.des : '';
      item.coverImg = app ? app.coverImg : '';
      item.demoData = app ? app.demoData : '';
      item.preset = app.userId === id ? app.preset : '******';
    });
    return { rows, count };
  }
}
