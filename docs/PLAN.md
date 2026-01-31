# Documentation & Configuration Update Plan

## 🎯 Goal
Update project documentation and agent configuration to strictly enforce development standards and reflect the latest project state.

## 📋 Context
- **User Request**: Update `PROJECT_DOCUMENTATION.md`, `README.md`, and `.agent/GEMINI.md`.
- **Primary Requirement**: Mandate adherence to `docs/REFACTOR_GUIDE.md` and `docs/STYLE_GUIDE.md`.
- **Current State**: Documentation updated Jan 29, 2026. Current Date: Jan 30, 2026. Needs sync.

## 🧩 Orchestration Strategy
**Agents Required**:
1.  **`project-planner`** (Phase 1): Create this plan.
2.  **`frontend-specialist`** (Phase 2): Scan UI/Component changes & Enforce Style Guide in docs.
3.  **`backend-specialist`** (Phase 2): Scan DB/API changes & Enforce Refactor Guide in docs.
4.  **`security-auditor`** (Phase 3): Verification scan.

## 📅 Execution Phases

### Phase 1: Planning (✅ Current)
- Create `docs/PLAN.md`.
- Define tasks for specialized agents.

### Phase 2: Implementation (Parallel Execution)

#### 1. Configuration Update (Target: `.agent/GEMINI.md`)
- **Action**: Add "Mandatory Guidelines" section.
- **Content**: Explicit instruction to read and follow `docs/REFACTOR_GUIDE.md` and `docs/STYLE_GUIDE.md` before any code changes.
- **Trigger**: `Tier 0` (Universal Rule).

#### 2. Documentation Sync (Target: `README.md`, `PROJECT_DOCUMENTATION.md`)
- **Action**: Add "Development Standards" section referencing the guides.
- **Action**: Scan `prism/schema.prisma` and `app/` for any unseen changes since Jan 29.
- **Action**: Update "Getting Started" or "Contribution" sections to mention the new strict guides.

#### 3. Codebase Reference Check
- **Action**: Verify `docs/REFACTOR_GUIDE.md` and `docs/STYLE_GUIDE.md` exist and are readable (Verified in Planning).

### Phase 3: Verification
- **Automated**: Run `npm run lint` to ensure current code complies (baseline check).
- **Manual**: Verify `GEMINI.md` effectively blocks non-compliant code generation (via instruction prompt check).
- **Deliverable**: Orchestration Report.

## ❓ User Review Required
- **Approval**: Confirm detailed steps before agents execute.
