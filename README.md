# Quantum Game Guides Website

A modern website for game guides and community resources.

## Tech Stack

- **Framework**: Next.js 14
- **Styling**: CSS with CSS variables for theming
- **Hosting**: Vercel
- **Email**: Mailchimp (to be configured)

## Setup Instructions

### Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Run development server: `npm run dev`
4. Open http://localhost:3000

### Deployment

The site is deployed on Vercel. Push to main branch to auto-deploy.

## Project Structure

```
/app
  /games
    /godforge
  /about
  /layout.js (main layout with navbar/footer)
  /page.js (landing page)
  /globals.css (global styles)
/public (assets)
/components (reusable components)
```

## Configuration for Tomorrow

- YouTube API integration for auto-pulled latest video
- Mailchimp email signup integration
- Additional game hubs (DC: Dark Legion, Void Hunters)
- More guide content and styling refinements

## Brand Colors

- Purple: #372061
- Gold: #CCA453
- Dark background: #0f0f0f
- Light background: #1a1a1a

## Next Steps

1. Review design and provide feedback
2. Add content to guide sections
3. Configure YouTube API for latest videos
4. Connect Mailchimp for email signups
5. Create additional game hub pages
