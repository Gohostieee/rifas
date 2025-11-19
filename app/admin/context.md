# Admin Panel Context

## Overview
The admin panel (`app/admin/page.tsx`) provides administrative functionality for managing rifas (raffles) and boletos (tickets). It requires password authentication and provides a comprehensive interface for managing the raffle system.

## Authentication
- Password-protected access via `/api/admin/verify` endpoint
- Authentication status stored in `sessionStorage` for the current session
- Logout clears session and resets all filters/state

## Features

### Rifas Management Tab
- View all rifas in a table format
- Create new rifas with image upload support
- Edit existing rifas
- Set a rifa as "selected" (only one can be selected at a time)
- Image uploads use Convex file storage (storage IDs converted to URLs automatically)

### Boletos Management Tab
- **Filtering**: Filter boletos by rifa using dropdown selector
- **Random Ticket Roll**: Select a rifa and click "Roll Random Ticket" to get a random boleto
- **Winner Management**: 
  - Set any boleto as winner (displays with yellow badge and highlighted row)
  - Remove winner status from a boleto
  - Winners automatically appear at the top of the list
- **Table Columns**:
  - Winner (badge indicator)
  - Number (ticket number)
  - Rifa (rifa title)
  - Name, Email, Phone (customer information)
  - Actions (Set Winner / Remove Winner buttons)
- **Pagination**: Supports pagination for large datasets (10 items per page)

## State Management
- `selectedRifaFilter`: Current rifa filter selection ("all" or specific rifa ID)
- `randomBoleto`: Currently selected random boleto (displayed in highlighted card)
- `isAnimating`: Boolean flag indicating if animated winner selection is in progress
- `animationBoleto`: Current boleto being displayed during animation
- `allBoletosForAnimation`: Array of all boletos used for animation cycling
- `currentPage`: Current pagination page
- Filters reset to page 1 when rifa filter changes

## User Interactions

### Random Ticket Flow
1. Select a rifa from the filter dropdown
2. Click "Roll Random Ticket" button
3. Random boleto appears in highlighted card above the table
4. Click "Set as Winner" to mark it as the winner
5. Winner automatically moves to top of table with yellow highlight

### Animated Winner Selection Flow
1. Select a rifa from the filter dropdown
2. Click "Pick Winner (Animated)" button (gradient yellow/orange button with sparkles icon)
3. A modal dialog opens showing an animated cycling through all boletos
4. Animation starts fast and gradually slows down over 3.5 seconds
5. Final winner is randomly selected and displayed
6. Winner is automatically set as winner and dialog closes
7. Winner appears at the top of the table with yellow highlight
8. Page resets to page 1 to show the winner

### Setting Winner Directly
- Click "Set Winner" button on any boleto row
- Winner badge appears and row is highlighted
- Winner automatically moves to top of list
- Click "Remove Winner" to unset winner status

## Data Dependencies
- Uses `api.admin.getAllRifas` to fetch all rifas for filter dropdown
- Uses `api.admin.getBoletos` with optional `rifaId` filter for paginated boleto list
- Uses `api.admin.getRandomBoleto` action to get random boleto (fresh each time)
- Uses `api.admin.getAllBoletosWithRifaInfo` action to get all boletos with rifa info for animation
- Uses `api.admin.setBoletoWinner` mutation to set/remove winner status

## UI Components
- Uses shadcn/ui components: Card, Table, Select, Button, Badge, Dialog, Form
- Icons from lucide-react: Trophy, Shuffle, X, Plus, Pencil, etc.
- Responsive design with proper spacing and visual hierarchy

## Future Enhancements
- Export boletos to CSV/Excel
- Bulk winner selection
- Search/filter by ticket number, name, email
- Statistics dashboard (total tickets sold per rifa, etc.)

