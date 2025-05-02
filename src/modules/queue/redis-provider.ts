import { Provider } from '@nestjs/common';

import IoRedis, { RedisOptions } from 'ioredis';
import { EnvService } from '@modules/env/env.service';

export const REDIS_CONNECTION = Symbol('REDIS_CONNECTION');

export type RedisClient = RedisOptions;

export const RedisProvider: Provider = {
  provide: REDIS_CONNECTION,
  useFactory(env: EnvService) {
    return new IoRedis(env.get('REDIS_URL_CONNECTION'), {
      maxRetriesPerRequest: null,
    });
  },
  inject: [EnvService],
};
