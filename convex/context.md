# Convex Backend Context

## Schema Overview
- `boletos` - Stores ticket purchases with number, name, email, phone
- `daily_rifa` - Stores raffle/prize information with title, subtitle, description, image, and optional selected flag

## Queries and Mutations

### Landing Page Query (`convex/landing.ts`)
- **`getSelectedRifa`** - Public query used by the landing page
  - Returns the rifa with `selected: true` if one exists
  - Falls back to the most recent rifa (by `_id` descending) if none are selected
  - Returns `null` if no rifas exist
  - Automatically converts storage IDs to URLs for images
  - Returns: `{ _id, title, subtitle, description, image (URL), selected } | null`

### Admin Queries (`convex/admin.ts`)
- **`getAllRifas`** - Returns all rifas with image URLs converted
- **`getBoletos`** - Paginated query for ticket purchases
- **`getStorageUrl`** - Converts storage ID to URL
- **`generateUploadUrl`** - Action to generate upload URL for file storage

### Admin Mutations (`convex/admin.ts`)
- **`setSelectedRifa`** - Sets a rifa as selected (unselects all others first)
- **`createRifa`** - Creates a new rifa (defaults to `selected: false`)
- **`updateRifa`** - Updates an existing rifa

## Image Storage
- Images can be stored as either:
  - Storage IDs (Convex file storage) - automatically converted to URLs in queries
  - Direct URLs (external or already converted)
- The `getAllRifas` and `getSelectedRifa` queries handle both formats automatically

## Selection Logic
- Only one rifa can be selected at a time (`selected: true`)
- When setting a new selected rifa, all others are automatically unselected
- The landing page displays the selected rifa, or the most recent if none selected
- New rifas are created with `selected: false` by default

