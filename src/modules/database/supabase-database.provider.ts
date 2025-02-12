import { Provider } from '@nestjs/common';
import { EnvService } from '@modules/env/env.service';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { type Database as SupabaseDatabaseType } from '@app/@types/supabase';

export const SUPABASE_DATABASE_PROVIDER = Symbol('SUPABASE_DATABASE_PROVIDER');

export type SupabaseDatabaseProvider = SupabaseClient<SupabaseDatabaseType>;

export const supabaseDatabaseProvider: Provider = {
  provide: SUPABASE_DATABASE_PROVIDER,
  useFactory(env: EnvService): SupabaseDatabaseProvider {
    return createClient<SupabaseDatabaseType>(
      env.get('SUPABASE_URL'),
      env.get('SUPABASE_SERVICE_ROLE_KEY'),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  },
  inject: [EnvService],
};
