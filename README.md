# Polacheck's Jewelers - Combined Phase 1 + Phase 2 Starter

This pack combines the earlier **Phase 1 working foundation** with the **Phase 2 service skeletons** for the Polacheck's Jewelers internal watch sales allocation system.

## What is included

### Phase 1 working foundation
- credentials login with signed cookie session
- role-aware dashboard
- customer create/edit flow
- brand catalog management
- model catalog management
- Prisma schema for MySQL
- seed data for demo users and starter catalog

### Phase 2 starter modules
- expanded schema for watch references, stock items, allocations, and catalog sync runs
- thewatchapi catalog client
- catalog import service skeleton
- inventory workbook parser
- allocation transaction service skeleton
- starter routes/pages for requirements, inventory, allocations, reports, and admin catalog sync

## Important note

This is a **combined starter pack**:
- Phase 1 pages are the more complete/working part
- Phase 2 is included as scaffold + service layer starter code, not a finished production workflow yet
- thewatchapi endpoint paths may need a small adjustment once you test with your paid API key

## Demo users

All seeded users use the same password:

`ChangeMe123!`

- admin@polachecks.local
- manager@polachecks.local
- sales@polachecks.local

## Setup

1. Copy environment file

```bash
cp .env.example .env
```

2. Update `DATABASE_URL`, `JWT_SECRET`, `THEWATCHAPI_BASE_URL`, and `THEWATCHAPI_API_KEY`

3. Install packages

```bash
npm install
```

4. Run migration

```bash
npx prisma migrate dev --name init_combined
```

5. Seed the database

```bash
npm run prisma:seed
```

6. Start the app

```bash
npm run dev
```

## Suggested next build step

Turn the Phase 2 scaffold into working flows:
- requirement create/edit/status change
- inventory upload preview + commit
- assign watch to requirement
- mark sale complete
- expire active allocations with a scheduled job
- wire admin catalog sync UI to thewatchapi
