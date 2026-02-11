---
name: supabase
description: Supabase JS Client patterns and Database best practices.
---

# Supabase Best Practices

## Client Initialization
Initialize the client once and export it for use in Server Actions and Components.

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## Data Access
- **Server-Side**: Use the client in Server Components or Actions.
- **Type Safety**: Generate types with Supabase CLI to get full intellisense for your tables.
- **RLS (Row Level Security)**: Ensure RLS is enabled on all tables. Even with an anon key, the backend should ideally use a service role for privileged operations if needed, but for Connectify, anon key with proper RLS on `contacts` and `matches` is standard.

## Common Operations
- `select()`: Always specify the columns you need instead of `*`.
- `insert()`, `update()`, `delete()`: Handle errors returned by the client.

```typescript
const { data, error } = await supabase
  .from('contacts')
  .select('id, name')
  .eq('id', contactId)
  .single();
```
