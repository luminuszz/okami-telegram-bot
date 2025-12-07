import { ChatRepository } from "@modules/database/repository/chat.repository";
import { RedmineChatRepository } from "@modules/database/repository/redmine-chat.respository";
import { supabaseDatabaseProvider } from "@modules/database/supabase-database.provider";
import { Global, Module } from "@nestjs/common";

@Global()
@Module({
	providers: [supabaseDatabaseProvider, ChatRepository, RedmineChatRepository],
	exports: [ChatRepository, RedmineChatRepository, supabaseDatabaseProvider],
})
export class DatabaseModule {}
