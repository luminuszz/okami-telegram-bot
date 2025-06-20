import { Inject, Injectable } from '@nestjs/common';
import {
  SUPABASE_DATABASE_PROVIDER,
  SupabaseDatabaseProvider,
} from '@modules/database/supabase-database.provider';

export const Alerts = {
  BUS_LATE: 'bus-late',
  VAN: 'van',
} as const;

export type AlertType = (typeof Alerts)[keyof typeof Alerts];

@Injectable()
export class ClassAlertRepository {
  constructor(
    @Inject(SUPABASE_DATABASE_PROVIDER)
    private readonly supabase: SupabaseDatabaseProvider,
  ) {}

  async createAlert(alertType: AlertType, chatId: string) {
    const { error, data } = await this.supabase
      .from('chats')
      .select('id')
      .eq('chat_id', chatId)
      .single();

    if (error) {
      throw new Error('not found chat');
    }

    await this.supabase.from('alerts').insert([
      {
        user_chat_id: data.id,
        alert_type: alertType,
      },
    ]);
  }
}
