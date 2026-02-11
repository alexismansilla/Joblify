---
name: skill-creator
description: How to create and document new AI agent skills.
---

# Creating New Skills

To add a new skill to the AI's repertoire:

1.  **Create Directory**: `mkdir skills/your-skill-name`
2.  **Add `SKILL.md`**: Define the name and description in YAML frontmatter.
3.  **Content**: Add clear, actionable guidelines and code examples.
4.  **Update `AGENTS.md`**: Add the new skill to the "Available Skills" table and the "Auto-invoke Skills" table.

## Skill Template

```markdown
---
name: skill-name
description: Brief description
---

# Skill Title

## Guidelines
- Detail 1
- Detail 2

## Usage Examples
\`\`\`typescript
// Code here
\`\`\`
```
