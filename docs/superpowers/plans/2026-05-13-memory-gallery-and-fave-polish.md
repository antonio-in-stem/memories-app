# Memory Gallery And Fave Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make memory cards visually consistent, improve modal readability, add a modal image carousel, and upgrade the heart interaction.

**Architecture:** Extend the existing static data normalization with an optional `galleryImages` array and provide derived demo images when JSON omits it. Keep UI orchestration inside `components/Experience.tsx`, reusing Framer Motion and existing store heart bumps. Keep the presentational polish in `app/globals.css`.

**Tech Stack:** Next.js, TypeScript, React, Framer Motion, React Spring, Tailwind/CSS, static JSON data.

---

### Task 1: Data Contract

**Files:**
- Modify: `lib/data.ts`
- Modify: `js/data.js`
- Modify: `tests/data-contract.test.mjs`

- [ ] Add `galleryImages?: string[]` to raw memories and `galleryImages: string[]` to normalized memories.
- [ ] Normalize explicit gallery images with asset-path cleanup.
- [ ] Derive three demo gallery images from the local memory asset pool when no gallery is provided.
- [ ] Add tests for explicit gallery normalization and fallback gallery population.

### Task 2: Feed Proportion

**Files:**
- Modify: `app/globals.css`

- [ ] Make alternating left/right cards use the same image column proportion.
- [ ] Preserve the alternating order and angled mask.
- [ ] Keep mobile stacked behavior unchanged.

### Task 3: Modal Gallery And Readability

**Files:**
- Modify: `components/Experience.tsx`
- Modify: `app/globals.css`

- [ ] Reduce modal title scale and improve body reading rhythm.
- [ ] Add a `MemoryGalleryCarousel` below the body.
- [ ] Add previous/next controls, active index dots, and smooth slide transitions.
- [ ] Reset carousel index when the active memory changes.

### Task 4: Heart Interaction

**Files:**
- Modify: `components/Experience.tsx`
- Modify: `app/globals.css`

- [ ] Extract the repeated memory heart button into a `MemoryHeartButton`.
- [ ] Add spring hover/tap behavior, animated count, halo, and particle burst.
- [ ] Reuse the same component in feed and modal.

### Task 5: Verification

**Files:**
- No source changes.

- [ ] Run `npm test`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm audit --audit-level=moderate`.
- [ ] Run `npm run build`.
