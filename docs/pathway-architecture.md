# Pathway Architecture

This project is organised so that location, pathway, and clinician-facing route concerns stay separate.

## Current pattern

### 1. Registry and route discovery

- `src/lib/pathway-registry.ts`
  Holds the browseable catalogue:
  `location -> pathway -> variant -> calculator href`

- `src/routes/pathways.tsx`
- `src/routes/pathways.$location.tsx`
- `src/routes/pathways.$location.$pathway.tsx`
- `src/routes/pathways.$location.$pathway.$variant.tsx`
  These are thin browsing routes only.

### 2. Source-locked clinical logic

- `src/lib/pathways/types.ts`
  Shared pathway result types.

- `src/lib/pathways/ncl/lft.ts`
- `src/lib/pathways/ncl/anaemia.ts`
  One module per `location/pathway`.
  These files are the canonical clinical logic layer and must remain:
  - PDF-only
  - auditable
  - deterministic only where the source is deterministic

If another location is added later, the matching file pattern should be:

- `src/lib/pathways/<location>/<pathway>.ts`

Examples:

- `src/lib/pathways/nwl/lft.ts`
- `src/lib/pathways/nwl/anaemia.ts`
- `src/lib/pathways/ncl/child-anaemia.ts`

### 3. Clinician-facing pages

- `src/routes/pathway.lft.tsx`
- `src/routes/pathway.anaemia.tsx`

These route files should stay thin.
Their job is to:
- collect user inputs
- show exact PDF actions
- expose ambiguity warnings

They should not contain hidden clinical decision logic.

### 4. Source material and audit trail

- `src/pathways/`
  Structured source JSON and pathway metadata.

- `docs/clinical-audit.md`
  What was removed because it was inferred.

- `docs/clinical-ambiguities.md`
  Where the PDF itself leaves gaps or requires clinician judgement.

## Scaling rule

When adding a new pathway:

1. add the location/pathway entry in `src/lib/pathway-registry.ts`
2. create the source-locked module in `src/lib/pathways/<location>/<pathway>.ts`
3. create or connect the clinician-facing route
4. record any unresolved PDF ambiguity in `docs/clinical-ambiguities.md`
5. do not import logic from another location unless the guideline is actually shared

## Clinical safety rule

If a rule is not explicitly supported by the source PDF:

- do not add it to the calculator
- do not silently infer it from local lab practice
- do not auto-upgrade urgency
- stop, ask for the explicit branch, or mark the gap in the ambiguity log
