import { z } from "zod";

export const updateTelegramChatIdSchema = z.object({
  recipientId: z.string(),
  telegramChatId: z.string(),
});

export type UpdateTelegramChatId = z.infer<typeof updateTelegramChatIdSchema>;

export const sendAuthCodeByEmailSchema = z.object({
  email: z.string().email(),
});

export type SendAuthCodeByEmail = z.infer<typeof sendAuthCodeByEmailSchema>;

export const compareAuthCodeSchema = z.object({
  userId: z.string(),
  authCode: z.string(),
});

export type CompareAuthCode = z.infer<typeof compareAuthCodeSchema>;

export const findSubscriberByEmailSchema = z.object({
  email: z.string().email(),
});

export type FindSubscriberByEmail = z.infer<typeof findSubscriberByEmailSchema>;

export type Subscriber = {
  id: string;
  recipientId: string;
};

export type FetchSubscibersByChatIdResponse = {
  email: string;
  subscriberId: string;
  recipientId: string;
}[];
