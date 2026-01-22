# 🤖 AI Refactoring Instructions for Next.js Project

## 🎯 Objective
Review this Next.js codebase and refactor large or complex components to follow modern best practices for:

- Maintainability
- Performance
- Readability
- Scalability
- Accessibility
- Type safety
- Reusability

Preserve existing functionality and UI behavior unless explicitly instructed otherwise.

---

## 🧭 General Rules

1. **Do NOT change business logic behavior.**
2. **Do NOT introduce breaking API changes** unless clearly justified.
3. Prefer **small, focused components** over large monolith components.
4. Prefer **composition over prop drilling.**
5. Avoid premature optimization — keep code clear and predictable.
6. Follow idiomatic **Next.js App Router** patterns if applicable.
7. All code must compile and pass TypeScript checks.

---

## 📦 Component Refactoring Rules

### 1. Component Size Limits
If a component:
- Exceeds ~150–200 lines
- Contains multiple responsibilities
- Has deeply nested JSX
- Mixes data fetching, business logic, and UI

➡️ Split it into:

- Container (data + orchestration)
- Presentational components (UI only)
- Reusable UI primitives
- Custom hooks for logic

Example structure:


components/
├─ dashboard/
│ ├─ DashboardContainer.tsx
│ ├─ DashboardHeader.tsx
│ ├─ DashboardList.tsx
│ └─ useDashboard.ts


---

### 2. Hooks Extraction
Extract logic into hooks when you see:

- Multiple useState, useEffect, useMemo
- Data fetching logic
- Form state logic
- Derived state logic
- Large event handlers

Rules:
- Hook names must start with `use`
- Hooks must be reusable and testable
- Avoid passing entire objects if only specific fields are needed

---

### 3. Server vs Client Components (Next.js)

- Default to **Server Components**
- Only use `"use client"` when required:
  - Browser-only APIs
  - Event handlers
  - Local state
  - Animations

Move logic upward to server when possible:
- Data fetching
- Auth checks
- Caching
- Serialization

---

### 4. Performance Best Practices

- Use dynamic imports for heavy components
- Avoid unnecessary re-renders
- Memoize expensive calculations
- Avoid inline object/array creation in JSX
- Use proper keys for lists
- Prefer CSS over JS layout calculations

---

### 5. TypeScript Rules

- No `any`
- Prefer explicit types for:
  - Props
  - API responses
  - Hook return values
- Use discriminated unions when possible
- Avoid excessive generics
- Use readonly where applicable

---

### 6. Accessibility (A11y)

Ensure:
- Semantic HTML (`button`, `nav`, `header`, etc.)
- Proper labels for inputs
- Keyboard navigation works
- ARIA only when needed
- Images have alt text
- Buttons are not divs

---

### 7. File & Folder Organization

Prefer:


/components
/feature-name
index.ts
FeatureContainer.tsx
FeatureView.tsx
hooks.ts
types.ts


Avoid:
- God folders
- Circular dependencies
- Deep relative imports (`../../../../`)

---

### 8. Styling Rules

- Prefer Tailwind or CSS Modules consistently
- Avoid inline styles unless dynamic
- Extract repeated class sets
- Avoid magic numbers

---

### 9. Error Handling

- Gracefully handle loading and error states
- Never swallow errors silently
- Log actionable errors
- Provide fallback UI when possible

---

### 10. Documentation Rules

When refactoring:
- Add concise comments for complex logic
- Update prop interfaces if changed
- Document non-obvious behavior
- Avoid redundant comments

---

## 🔍 Refactoring Output Expectations

For every refactored component:

- ✅ Smaller components created
- ✅ Logic extracted into hooks
- ✅ Types added or improved
- ✅ Improved folder structure
- ✅ No behavior regressions
- ✅ Clear naming
- ✅ Performance considerations applied
- ✅ Accessibility validated

---

## 🧪 Optional Enhancements (If Safe)

Only apply if low-risk:

- Add memoization
- Add loading skeletons
- Improve error boundaries
- Extract shared UI components
- Simplify conditional rendering

---

## 🚫 Do NOT

- Introduce new libraries unless requested
- Change styling framework
- Change routing conventions
- Change API contracts
- Over-engineer abstractions
