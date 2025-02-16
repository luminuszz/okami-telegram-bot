import {
  SUPABASE_DATABASE_PROVIDER,
  SupabaseDatabaseProvider,
} from '@modules/database/supabase-database.provider';
import { Inject, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ChatRepository {
  constructor(
    @Inject(SUPABASE_DATABASE_PROVIDER)
    private readonly supabase: SupabaseDatabaseProvider,
  ) {}

  private logger = new Logger(ChatRepository.name);

  async saveChat(chatId: string) {
    const { data: existsNote } = await this.supabase
      .from('chats')
      .select()
      .eq('chat_id', chatId)
      .single();

    if (!existsNote) {
      const { error } = await this.supabase.from('chats').insert([
        {
          chat_id: chatId,
        },
      ]);

      if (error) {
        throw new Error(error.message);
      }
    }
  }

  async deleteByChatId(chatId: string) {
    const { error } = await this.supabase
      .from('chats')
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
        .from('chats')
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

  async fetchClassesBySemester(semesterId: number) {
    const { data: classes, error } = await this.supabase
      .from('class')
      .select()
      .eq('semester_id', semesterId);

    if (error) {
      throw new Error(error.message);
    }

    return classes;
  }

  async findActiveSemester() {
    const { data, error } = await this.supabase
      .from('semesters')
      .select('*')
      .eq('active', true)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}
