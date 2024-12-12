import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { EnvService } from '../env/env.service';
import { OkamiService } from './okami.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: (env: EnvService) => ({
        baseURL: env.get('OKAMI_API_URL'),
        headers: {
          accesstoken: env.get('OKAMI_API_ACCESS_TOKEN'),
        },
      }),
      inject: [EnvService],
    }),
  ],
  providers: [OkamiService],
  exports: [OkamiService],
})
export class OkamiModule {}
