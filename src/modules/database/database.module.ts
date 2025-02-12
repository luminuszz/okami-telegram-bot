import { Module } from '@nestjs/common';
import { supabaseDatabaseProvider } from '@modules/database/supabase-database.provider';
import { ChatRepository } from '@modules/database/chat.repository';

@Module({
  providers: [supabaseDatabaseProvider, ChatRepository],
  exports: [ChatRepository],
})
export class DatabaseModule {}
