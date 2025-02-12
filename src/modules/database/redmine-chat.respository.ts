import { Inject, Injectable } from '@nestjs/common';
import {
  SUPABASE_DATABASE_PROVIDER,
  SupabaseDatabaseProvider,
} from './supabase-database.provider';

@Injectable()
export class RedmineChatRepository {
  constructor(
    @Inject(SUPABASE_DATABASE_PROVIDER)
    private readonly supabase: SupabaseDatabaseProvider,
  ) {}

  async saveChat(chatId: string, projectName?: string) {
    const { data: existsChat } = await this.supabase
      .from('redmine_chats')
      .select()
      .eq('chat_id', chatId)
      .single();

    if (!existsChat) {
      const { error } = await this.supabase.from('redmine_chats').insert([
        {
          chat_id: chatId,
          nmProject: projectName,
        },
      ]);

      if (error) {
        throw new Error(error.message);
      }
    }
  }

  async deleteByChatId(chatId: string) {
    const { error } = await this.supabase
      .from('redmine_chats')
      .delete()
      .eq('chat_id', chatId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async *getChatsInBatches(batchSize: number = 10) {
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const { data: chats, error } = await this.supabase
        .from('redmine_chats')
        .select()
        .range(offset, offset + batchSize - 1);

      if (error) {
        throw new Error(error.message);
      }

      if (chats.length < batchSize) {
        hasMore = false;
      }

      yield chats;
      offset += batchSize;
    }
  }
}
