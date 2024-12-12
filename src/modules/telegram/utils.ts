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
