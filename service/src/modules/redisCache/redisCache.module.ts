import { Module, Global, Logger } from '@nestjs/common';
import { RedisCacheService } from './redisCache.service';
import { RedisCacheController } from './redisCache.controller';
import { ConfigModule, ConfigService } from 'nestjs-config';

import { createClient } from 'redis';

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [RedisCacheController],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (redisConfig: ConfigService) => {
        const port = +process.env.REDIS_PORT;
        const host = process.env.REDIS_HOST;
        const password = process.env.REDIS_PASSWORD;
        const username = process.env.REDIS_USER;

        if (!host || !port) {
          Logger.error(`Please config Redis config`, 'RedistCacheModule');
          return;
        }

        const client = createClient({
          socket: { host, port },
          username,
          password,
        });

        const res = await client.connect();

        client.on('ready', () => {
          Logger.debug(`Your Redis connection successful`, 'RedistCacheModule');
        });
        client.on('error', () => {
          Logger.error(`Your Redis connection failed`, 'RedistCacheModule');
        });
        return client;
      },
      inject: [ConfigService],
    },
    RedisCacheService,
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisCacheModule {}
