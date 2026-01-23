import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { AxiosError } from "axios";
import { firstValueFrom } from "rxjs";
import { Either, left, right } from "../helpers";
import {
  CompareAuthCode,
  compareAuthCodeSchema,
  FetchSubscibersByChatIdResponse,
  FindSubscriberByEmail,
  findSubscriberByEmailSchema,
  SendAuthCodeByEmail,
  Subscriber,
  sendAuthCodeByEmailSchema,
  UpdateTelegramChatId,
  updateTelegramChatIdSchema,
} from "./dtos";

@Injectable()
export class OkamiService {
  constructor(private readonly httpClient: HttpService) {}

  async updateTelegramChatId(data: UpdateTelegramChatId) {
    try {
      const results = await updateTelegramChatIdSchema.parseAsync(data);

      await firstValueFrom(
        this.httpClient.patch("/integration/telegram/update-chat-id", results),
      );

      return right(true);
    } catch (err) {
      return left(err);
    }
  }

  async sendAuthCodeByEmail(data: SendAuthCodeByEmail) {
    try {
      const results = await sendAuthCodeByEmailSchema.parseAsync(data);

      await firstValueFrom(
        this.httpClient.post("/integration/telegram/send-auth-code", results),
      );

      return right(true);
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
          "/integration/telegram/compare-auth-code",
          results,
        ),
      );

      return right(response.data);
    } catch (err) {
      return left(err as AxiosError);
    }
  }

  async findSubscriberByEmail(
    data: FindSubscriberByEmail,
  ): Promise<Either<AxiosError, { subscriber: Subscriber }>> {
    try {
      const results = await findSubscriberByEmailSchema.parseAsync(data);

      const response = await firstValueFrom(
        this.httpClient.get<{ subscriber: Subscriber }>(
          `/integration/telegram/find/${results.email}`,
        ),
      );

      return right(response.data);
    } catch (err) {
      return left(err as AxiosError);
    }
  }

  async fetchSubscribersByChatId(
    chat_id: string,
  ): Promise<FetchSubscibersByChatIdResponse> {
    const { data } = await firstValueFrom(
      this.httpClient.get<FetchSubscibersByChatIdResponse>(
        "/integration/telegram/subscribers_by_chat",
        {
          params: {
            chat_id,
          },
        },
      ),
    );

    return data;
  }

  async deleteTelegramChatId(subscriberId: string) {
    await firstValueFrom(
      this.httpClient.delete(`/integration/telegram/chat/${subscriberId}`),
    );
  }
}
