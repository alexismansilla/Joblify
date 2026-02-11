---
name: tailwind-4
description: Tailwind CSS 4 - Utility-first CSS variables and clean class management.
---

# Tailwind CSS 4 Guidelines

## New Paradigm
Tailwind 4 moves configuration into CSS variables and uses a more modern engine.

## `cn()` Utility
Use a `cn()` utility (combining `clsx` and `tailwind-merge`) to handle conditional classes and avoid collisions.

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Best Practices
1.  **Avoid Ad-hoc `var()` in className**: Define your theme in the CSS file using `@theme` and use the resulting utility classes.
2.  **Container Queries**: Leverage the built-in container query support (`@lg:`, etc.).
3.  **Logical Properties**: Prefer `ms-*`, `me-*`, `ps-*`, `pe-*` for better RTL support if needed.
4.  **Glassmorphism**: Use `backdrop-blur-*` and semi-transparent backgrounds for the premium "Connectify" look.

## Premium Aesthetics
- Zinc scale for neutrals.
- Indigo/Violet for primaries.
- Ultra-rounded corners: `rounded-3xl` or `rounded-full`.
