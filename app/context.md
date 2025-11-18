# Landing Page Context

## Overview
The landing page (`app/page.tsx`) is the main public-facing page of the application. It displays the currently selected raffle (rifa) and encourages visitors to purchase tickets.

## Structure

### Sections
1. **Hero Section** - Main headline, value proposition, and primary CTAs
2. **Featured Rifa Section** - Displays the currently selected raffle with image, title, subtitle, and description
3. **Benefits Section** - Three key benefits (Easy to Enter, Amazing Prizes, Secure & Fair)
4. **Trust Indicators** - Testimonials and statistics to build credibility
5. **Final CTA Section** - Bottom call-to-action to purchase tickets

### Data Dependencies
- Uses `api.landing.getSelectedRifa` query from Convex to fetch the current raffle
- Handles three states: loading (undefined), no rifa available (null), and rifa available (rifa object)
- The rifa object includes: `_id`, `title`, `subtitle`, `description`, `image` (URL), and `selected` (boolean)

### User Interactions
- Smooth scroll navigation to sections via anchor links
- "Buy Ticket" CTA currently shows placeholder alert (to be implemented)
- Responsive design: mobile-first, adapts to tablet and desktop breakpoints

### Styling
- Uses existing design tokens from `app/globals.css`
- Leverages UI components from `components/ui/` (Button, Badge, Card)
- Gradient backgrounds and subtle shadows for visual hierarchy
- Icons from `lucide-react` for visual enhancement

## Future Enhancements
- Implement actual ticket purchase flow
- Add animation/transitions for section reveals
- Integrate real testimonials from database
- Add countdown timer for raffle deadline
- Display available ticket numbers or remaining tickets

