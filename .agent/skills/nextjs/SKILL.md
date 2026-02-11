---
name: nextjs
description: Next.js App Router, Server Actions, and Streaming.
---

# Next.js 15/16 Best Practices

## App Router Structure
- **`app/page.tsx`**: Entry point for a route.
- **`app/layout.tsx`**: Shared UI for a segment.
- **`app/loading.tsx`**: Automatic loading states (Streaming).
- **`app/error.tsx`**: Error boundaries for segments.

## Data Fetching
- Fetch data directly in Server Components using `async/await`.
- Use `revalidatePath` or `revalidateTag` after mutations in Server Actions to refresh the UI.

## Server Actions
- Define actions in `app/actions/` for reusability.
- Use `'use server'` at the top of the file or function.
- Handle errors gracefully and return them to the client.

## Metadata & SEO
- Export a `metadata` object or `generateMetadata` function from pages/layouts.
- Use `robots.txt` and `sitemap.xml`.

```typescript
// app/actions/contact.ts
'use server'

import { revalidatePath } from 'next/cache';

export async function createContact(formData: FormData) {
  // Logic here
  revalidatePath('/contacts');
  return { success: true };
}
```
