import { ChatRepository } from '@modules/database/chat.repository';
import { supabaseDatabaseProvider } from '@modules/database/supabase-database.provider';
import { Module } from '@nestjs/common';
import { RedmineChatRepository } from './redmine-chat.respository';

@Module({
  providers: [supabaseDatabaseProvider, ChatRepository, RedmineChatRepository],
  exports: [ChatRepository],
})
export class DatabaseModule {}
