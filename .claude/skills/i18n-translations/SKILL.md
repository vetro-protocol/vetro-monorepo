---
name: i18n-translations
description: Add, modify, or validate translations in the project's locale files (en and es). Use this skill whenever adding or updating translation keys.
---

# i18n Translations Skill

## Target Files

- `web/src/i18n/locales/en/translation.json`
- `web/src/i18n/locales/es/translation.json`

## Rules

1. Always update both files together — never leave them out of sync.
2. Sort keys alphabetically within each nesting level.
3. Use kebab-case for keys (e.g., `"withdraw-toast-title"`).
4. Never hardcode token symbols — use `{{variable}}` interpolation instead.
5. Use i18next plural suffixes when text varies by count:

   ```json
   { "days": "{{count}} Day", "days_other": "{{count}} Days" }
   ```

6. These terms stay in English in the other locales: **bridge**, **earn**, **pool**, **stablecoins**, **stake**, **staked**, **staking**.

## Workflow

1. Read both locale files before making changes.
2. Add keys in alphabetical order within their section, matching existing nesting.
3. Write the English value and a natural Spanish translation (respecting rule 6).
4. Verify both files have matching key structures.
