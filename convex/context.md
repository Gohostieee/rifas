# Convex Backend Context

## Schema Overview
- `boletos` - Stores ticket purchases with number, name, email, phone, rifa reference, and optional winner flag
  - Indexed by `rifa` field for efficient filtering (`by_rifa` index)
  - `winner` field defaults to `false`/`undefined` for new boletos
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
  - Supports optional `rifaId` filter to show boletos for a specific rifa
  - Automatically sorts winners to the top, then by creation time (newest first)
  - Includes rifa title information in results
- **`getBoletosByRifa`** - Helper query to get all boletos for a specific rifa (used by actions)
- **`getRifaById`** - Helper query to get a rifa by ID (used by actions)
- **`getStorageUrl`** - Converts storage ID to URL
- **`generateUploadUrl`** - Action to generate upload URL for file storage

### Admin Mutations (`convex/admin.ts`)
- **`setSelectedRifa`** - Sets a rifa as selected (unselects all others first)
- **`createRifa`** - Creates a new rifa (defaults to `selected: false`)
- **`updateRifa`** - Updates an existing rifa
- **`setBoletoWinner`** - Sets or removes the winner flag on a boleto
  - Args: `boletoId`, `isWinner` (boolean)
  - When setting a boleto as winner, it will automatically appear at the top of the list

### Admin Actions (`convex/admin.ts`)
- **`getRandomBoleto`** - Action to get a random boleto from a specific rifa
  - Returns a fresh random selection each time (not cached like queries)
  - Includes rifa title information in the result
  - Returns `null` if no boletos exist for the rifa
- **`getAllBoletosWithRifaInfo`** - Action to get all boletos for a rifa with rifa information
  - Used for animated winner selection feature
  - Returns array of boletos with rifa title included
  - Shuffled on client side for random animation order

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

