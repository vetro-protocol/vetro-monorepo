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

6. These terms stay in English in the other locales: **bridge**, **earn**, **stablecoins**, **stake**, **staked**, **staking**.
7. **Translations must address the user with a formal, respectful register.** Machine translation defaults to the informal register, so always review the tone of any string you add or edit. For Spanish (`es`), use the formal _usted_ form, never the informal _tú_/_vos_:
   - Possessives: `su` / `sus`, not `tu` / `tus` (e.g. "sus fondos", not "tus fondos").
   - Verbs and imperatives: conjugate for _usted_ — "Haga clic", "Use", "Conecte", "Ingrese", "Revise", "Confirme", "Intente de nuevo" — not "Haz clic", "Usa", "Conecta", "Ingresa", "Revisa", "Confirma", "Intenta de nuevo".
   - Pronouns: prefer "le" / "lo" / "la"; avoid "te" / "ti".

   Existing strings that follow this convention (use as reference):
   - `common.enter-amount` → "Ingrese un monto"
   - `common.approve-10x-tooltip` → "Apruebe hasta 10× el monto de **su** transacción… Puede revocarlo en cualquier momento."
   - `pages.borrow.progress.confirm-description` → "Revise los detalles y confirme el préstamo en **su** billetera."

## Workflow

1. Read both locale files before making changes.
2. Add keys in alphabetical order within their section, matching existing nesting.
3. Write the English value and a natural Spanish translation, respecting the English-only terms (rule 6) and the formal register (rule 7).
4. Verify both files have matching key structures.
