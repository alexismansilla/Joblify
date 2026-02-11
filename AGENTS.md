# Connectify Repository Guidelines

## How to Use This Guide

- Start here for project norms and AI agent behaviors.
- This guide ensures consistency across the Connectify stack (Next.js, Supabase, Tailwind).
- Use the available skills to deep-dive into specific technology patterns.

## Available Skills

Use these skills for detailed patterns on-demand:

### Generic Skills
| Skill | Description | URL |
|-------|-------------|-----|
| `typescript` | Const types, flat interfaces, utility types | [SKILL.md](skills/typescript/SKILL.md) |
| `react-19` | No useMemo/useCallback, Server Components | [SKILL.md](skills/react-19/SKILL.md) |
| `nextjs` | App Router, Server Actions, Streaming | [SKILL.md](skills/nextjs/SKILL.md) |
| `tailwind-4` | cn() utility, CSS variables, Glassmorphism | [SKILL.md](skills/tailwind-4/SKILL.md) |
| `supabase` | Client patterns, RLS, Type safety | [SKILL.md](skills/supabase/SKILL.md) |

### Connectify-Specific Skills
| Skill | Description | URL |
|-------|-------------|-----|
| `connectify` | Project overview, component navigation | [SKILL.md](skills/connectify/SKILL.md) |
| `skill-creator` | Create new AI agent skills | [SKILL.md](skills/skill-creator/SKILL.md) |

---

## Auto-invoke Skills

When performing these actions, ALWAYS invoke the corresponding skill FIRST:

| Action | Skill |
|--------|-------|
| Adding or modifying database schemas | `supabase` |
| App Router / Server Actions | `nextjs` |
| Committing changes | `connectify` |
| Creating reusable UI components | `tailwind-4` |
| Creating/modifying React components | `react-19` |
| General Connectify development questions | `connectify` |
| Working with Tailwind classes | `tailwind-4` |
| Writing TypeScript types/interfaces | `typescript` |
| Building networking features (Matches/QR) | `connectify` |

---

## Project Overview

Connectify is a modern networking tool for managing event contacts, generating QR codes, and tracking "matches" between attendees.

| Component | Location | Tech Stack |
|-----------|----------|------------|
| Frontend & Backend | `app/` | Next.js 16 (App Router) |
| Database | Supabase | PostgreSQL + RLS |
| UI | `app/components/` | Tailwind 4 + Framer Motion |
| Utilities | `lib/` | ExcelJS, JsPDF, QZ-Tray |

---

## Standard Development

```bash
# Setup
npm install

# Development
npm run dev

# Code quality
npm run lint
# (Add build check)
npm run build
```

---

## Commit & Pull Request Guidelines

Follow conventional-commit style: `<type>[scope]: <description>`

**Types:** `feat`, `fix`, `docs`, `chore`, `perf`, `refactor`, `style`, `test`

Before creating a PR:
1. Ensure all TypeScript types are correct.
2. Verify UI responsiveness and accessibility.
3. Test Server Actions for potential edge cases.
