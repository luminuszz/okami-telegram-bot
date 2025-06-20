import { ChatRepository } from '@modules/database/repository/chat.repository';
import { supabaseDatabaseProvider } from '@modules/database/supabase-database.provider';
import { Global, Module } from '@nestjs/common';
import { RedmineChatRepository } from '@modules/database/repository/redmine-chat.respository';
import { ClassAlertRepository } from '@modules/database/repository/class-alert.repository';

@Global()
@Module({
  providers: [
    supabaseDatabaseProvider,
    ChatRepository,
    RedmineChatRepository,
    ClassAlertRepository,
  ],
  exports: [ChatRepository, RedmineChatRepository, ClassAlertRepository],
})
export class DatabaseModule {}
