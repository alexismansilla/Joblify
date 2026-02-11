---
name: connectify
description: Project overview, component navigation, and domain models for Connectify.
---

# Connectify - Project Overview

Connectify is a modern web application for contact management and QR networking at events.

## Component Navigation

- `/app`: Main application routes (Next.js App Router).
- `/app/actions`: Server Actions for database mutations and business logic.
- `/app/components`: Reusable UI components.
- `/lib`: Helper functions and shared logic (Supabase client, formatting).
- `/public`: Static assets (images, icons).

## Key Domain Models

### Contact
Represents an event attendee.
- `id`: UUID
- `name`: Full name
- `email`: Email address
- `phone`: WhatsApp number
- `created_at`: Timestamp

### Match
Represents a connection established via QR scan.
- `id`: UUID
- `contact_id`: The person who owns the QR.
- `scanner_id`: The person who scanned (if registered).
- `created_at`: Timestamp

## Project Norms

- Use **Server Actions** for all mutations.
- Use **Next.js App Router** (RSC by default).
- Styling: **Tailwind CSS 4** with premium aesthetics (Zinc/Indigo).
- Database: **Supabase** via `@supabase/supabase-js`.
- Error Handling: Graceful UI feedback for failed imports or printing.
