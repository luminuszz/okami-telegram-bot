import { z } from 'zod';

export const payloadEmailSchema = z
  .string({
    invalid_type_error: 'Valor inválido',
    required_error: 'Informe o email',
  })
  .email('Informe um e-mail válido');

export type UserMetadata = {
  email: string;
  chatId: string;
  emailSanded: boolean;
};

export const payloadAthCodeSchema = z
  .string()
  .min(6, 'Código inválido')
  .max(6, 'Código inválido');

export type SendMessagePayload = {
  message: string;
  imageUrl?: string;
  chatId: string;
};

export function getWebhookUrl(domain: string | undefined, path: string): string {
  if (!domain) {
    throw new Error("APP_DOMAIN is not set. Webhook cannot be configured.");
  }
  const normalizedDomain = domain.endsWith("/") ? domain.slice(0, -1) : domain;
  return `${normalizedDomain}${path}`;
}
