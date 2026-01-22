# Next.js Project Naming Conventions

This document outlines the standard naming practices for files, folders, and code structures within this Next.js application to ensure SEO optimization, cross-platform compatibility, and maintainability.

## 1. File System & Routing

The file system directly impacts routing and deployment. To avoid case-sensitivity issues between local development (macOS/Windows) and production (Linux), follow these rules:

| Entity | Convention | Example |
| :--- | :--- | :--- |
| **Public Routes** | `kebab-case` | `app/user-profile/page.tsx` → `/user-profile` |
| **General Folders** | `kebab-case` | `components/common-ui/`, `lib/api-helpers/` |
| **General Files** | `kebab-case` | `auth-provider.tsx`, `data-fetching.ts` |
| **Special Files** | `lowercase` | `layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx` |
| **Private Folders**| `_folder-name`| `_components/`, `_hooks/` (ignored by router) |
| **Route Groups**  | `(folder-name)`| `(auth)/login/page.tsx` (grouping without URL impact) |

## 2. Code & Components

While filenames use hyphens, the logic within the files follows standard JavaScript/React patterns:

| Entity | Convention | Example |
| :--- | :--- | :--- |
| **React Components**| `PascalCase` | `export function UserProfile() { ... }` |
| **Variables/Hooks** | `camelCase`  | `const userData = ...`, `const [isOpen, setIsOpen] = ...` |
| **Functions**       | `camelCase`  | `const fetchData = () => { ... }` |
| **Constants**       | `UPPER_SNAKE`| `export const API_RETRY_LIMIT = 3;` |
| **Types/Interfaces**| `PascalCase` | `interface UserAccount { ... }` |

## 3. Best Practices Summary

1.  **URL Friendliness:** Always use `kebab-case` for folders inside the `app/` directory to ensure SEO-friendly URLs (e.g., `/blog/my-first-post`).
2.  **OS Safety:** Never use `camelCase` or `PascalCase` for filenames. Linux servers are case-sensitive and may fail to find `UserProfile.tsx` if it was committed as `userprofile.tsx`.
3.  **Hooks Naming:** Even though hooks are called via `useAuth`, name the file `use-auth.ts` for file-system consistency.
4.  **Consistency:** For more details on project structure, refer to the [Next.js Documentation on Project Organization](https://nextjs.org).

---
*Last Updated: January 2026*
