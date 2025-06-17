import { ChatRepository } from '@modules/database/repository/chat.repository';
import { supabaseDatabaseProvider } from '@modules/database/supabase-database.provider';
import { Global, Module } from '@nestjs/common';
import { RedmineChatRepository } from '@modules/database/repository/redmine-chat.respository';

@Global()
@Module({
  providers: [supabaseDatabaseProvider, ChatRepository, RedmineChatRepository],
  exports: [ChatRepository, RedmineChatRepository],
})
export class DatabaseModule {}
