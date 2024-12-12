import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { Either, left, right } from '../helpers';
import {
  CompareAuthCode,
  compareAuthCodeSchema,
  FindSubscriberByEmail,
  findSubscriberByEmailSchema,
  SendAuthCodeByEmail,
  sendAuthCodeByEmailSchema,
  Subscriber,
  UpdateTelegramChatId,
  updateTelegramChatIdSchema,
} from './dtos';

@Injectable()
export class OkamiService {
  constructor(private readonly httpClient: HttpService) {}

  async updateTelegramChatId(data: UpdateTelegramChatId) {
    try {
      const results = await updateTelegramChatIdSchema.parseAsync(data);

      return right(
        firstValueFrom(
          this.httpClient.patch(
            '/notification/telegram/update-chat-id',
            results,
          ),
        ),
      );
    } catch (err) {
      return left(err);
    }
  }

  async sendAuthCodeByEmail(data: SendAuthCodeByEmail) {
    try {
      const results = await sendAuthCodeByEmailSchema.parseAsync(data);

      right(
        firstValueFrom(
          this.httpClient.post(
            '/notification/telegram/send-auth-code',
            results,
          ),
        ),
      );
    } catch (err) {
      return left(err);
    }
  }

  async compareAuthCode(
    data: CompareAuthCode,
  ): Promise<Either<AxiosError, { isMatch: boolean }>> {
    try {
      const results = await compareAuthCodeSchema.parseAsync(data);

      const response = await firstValueFrom(
        this.httpClient.post<{ isMatch: boolean }>(
          '/notification/telegram/compare-auth-code',
          results,
        ),
      );

      right(response.data);
    } catch (err) {
      return left(err);
    }
  }

  async findSubscriberByEmail(
    data: FindSubscriberByEmail,
  ): Promise<Either<AxiosError, { subscriber: Subscriber }>> {
    try {
      const results = await findSubscriberByEmailSchema.parseAsync(data);

      const response = await firstValueFrom(
        this.httpClient.get<{ subscriber: Subscriber }>(
          `/notification/telegram/find/${results.email}`,
        ),
      );

      return right(response.data);
    } catch (err) {
      return left(err);
    }
  }
}
