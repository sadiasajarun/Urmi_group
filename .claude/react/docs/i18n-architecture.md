# i18n Architecture Guide

## Overview

When a project requires multilingual support, use `react-i18next` for internationalization.

---

## Setup

### 1. Install Dependencies

```bash
npm install react-i18next i18next i18next-http-backend i18next-browser-languagedetector
```

### 2. Create i18n Configuration

```typescript
// app/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'ko'],
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
  });

export default i18n;
```

### 3. Create Locale Files

```
public/
└── locales/
    ├── en/
    │   └── translation.json
    └── ko/
        └── translation.json
```

```json
// public/locales/en/translation.json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "loading": "Loading...",
    "noResults": "No results found",
    "error": "Something went wrong"
  },
  "auth": {
    "login": "Login",
    "logout": "Logout",
    "email": "Email",
    "password": "Password"
  }
}
```

### 4. Initialize in Entry Point

```typescript
// root.tsx
import './i18n';
```

---

## Usage in Components

### Basic Translation

```typescript
import { useTranslation } from 'react-i18next';

export const SaveButton = () => {
  const { t } = useTranslation();
  return <button>{t('common.save')}</button>;
};
```

### With Variables

```typescript
// translation.json: "welcome": "Hello, {{name}}!"
<p>{t('welcome', { name: user.name })}</p>
```

### Plurals

```typescript
// translation.json: "items_one": "{{count}} item", "items_other": "{{count}} items"
<span>{t('items', { count: itemCount })}</span>
```

---

## Language Switcher

```typescript
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
    >
      <option value="en">English</option>
      <option value="ko">한국어</option>
    </select>
  );
};
```

---

## MANDATORY Rules

- **Every visible string** in UI components MUST use `t()` — no hardcoded text
- **Locale files** must exist for ALL supported languages before shipping
- **Keys** use dot notation organized by feature: `auth.login`, `dashboard.title`
- **Fallback language** must always be set (typically `en`)
- **Do NOT** use string concatenation for translated strings — use interpolation variables
- **Form validation messages** should also be translated via Zod `.refine()` with `t()`

## E2E Testing with i18n

When writing Playwright tests for i18n apps:
- Use `[data-testid]` selectors (language-independent) — preferred
- Or bilingual regex: `button:has-text(/Save|저장/i)`
- NEVER use English-only text selectors when default locale is not English

---

## Related

- [best-practices.md](best-practices.md) — Coding standards
- [component-patterns.md](component-patterns.md) — Component structure
- [typescript-standards.md](typescript-standards.md) — Type safety
