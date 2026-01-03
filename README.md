# EDF IR Tracker (Next.js, client only)

A frontend only tracker that stores progress in `localStorage` and supports:

- locked, unlocked, bought flags (with colours)
- totals for remaining credits and gems
- filter by collection, search, and status
- import export `.txt` (JSON)
- share code (bit packed + base64url) plus optional QR code

## Dev

```bash
npm install
npm run dev
```

## Build static

```bash
npm run build
# static output ends up in ./out
```

## Docker (for a VPS)

```bash
docker build -t edfir-tracker .
docker run --rm -p 8080:80 edfir-tracker
```

Open `http://localhost:8080`.

## Catalogue data

Collections live in `data/collections/*.json`.

Each file has this shape:

```json
{
  "id": "weapons_assault_rifles",
  "label": "Assault rifles",
  "items": [
    {
      "id": "assault:AE-2038",
      "name": "AE-2038",
      "cost": { "credits": 0, "yellow": 0, "red": 0, "blue": 0 },
      "unlock": "Starter"
    }
  ]
}
```

The share code relies on a stable item ID order. That order is defined in `lib/catalog.ts` (it sorts by ID), so keep IDs stable across devices.
