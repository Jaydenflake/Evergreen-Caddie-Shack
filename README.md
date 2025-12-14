# Evergreen Team Communication & Recognition App

A premium social media-style platform for team communication, recognition, and celebrating the Evergreen core values at Castle Rock golf club.

![Evergreen](public/vite.svg)

## Features

### 🏠 Home Feed
- Welcome dashboard with recent announcements and messages
- Quick access to all platform features
- Team statistics and activity overview

### 💬 Messages
- Department-based channel communication
- Real-time messaging with live updates
- Clean, modern chat interface
- Channels: General, Clubhouse, Golf Pro Shop, Food & Beverage, Maintenance, Events

### ✨ Creating Magic (Hospitality Spotlight)
- Social feed for celebrating exceptional hospitality
- Highlight teammates who create moments of magic for members
- Associate recognitions with Evergreen core values
- Support for images and videos
- Like and comment on posts

### 🏆 Nomination System
- Nominate teammates for practicing Evergreen's 5 core values
- Detailed nomination form with value descriptions
- Track nominations given and received
- Recognition-driven reward system

### 📢 Announcements
- Important team communications
- Category badges (Urgent, Celebration, Info)
- Pinned announcements for critical updates
- Beautiful, organized announcement cards

### 👤 My Profile
- Personal stats dashboard
- Nominations received and awards won
- Core values recognition distribution
- Recent recognitions feed

## Evergreen Core Values

1. **Relentless Hospitality** - emphasis on exceptional experiences
2. **Play Ready Golf** - proactive sense of urgency
3. **Spend Time on the Range** - continuous improvement
4. **Be a Caddie** - no ego, lend a hand
5. **Play It As It Lies** - integrity and confidence

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom gradients and glassmorphism
- **Routing**: React Router v6
- **Backend**: Supabase (PostgreSQL + Real-time + Storage)
- **Icons**: Lucide React
- **Design**: Modern social media aesthetic with dark emerald/purple gradients

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Update the `.env` file with your credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Database Migration

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `migration.sql`
4. Paste and run the migration in the SQL Editor

This will create:
- All database tables (profiles, nominations, messages, channels, magic_moments, announcements)
- The 5 Evergreen core values
- Sample data for development
- Row-level security policies
- Real-time subscriptions
- Storage buckets for images/videos

### 4. Storage Buckets

The migration automatically creates three storage buckets:
- `avatars` - Profile pictures
- `magic-moments` - Images/videos for magic moment posts
- `message-attachments` - File attachments in messages

All buckets are configured with public access and appropriate security policies.

### 5. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist` directory.

## Project Structure

```
src/
├── components/
│   └── Layout.tsx          # Main layout with sidebar navigation
├── pages/
│   ├── Home.tsx            # Home feed dashboard
│   ├── Messages.tsx        # Channel-based messaging
│   ├── MagicMoments.tsx    # Hospitality spotlight feed
│   ├── Nominate.tsx        # Nomination form
│   ├── Announcements.tsx   # Announcements view
│   └── Profile.tsx         # User profile with stats
├── lib/
│   └── supabase.ts         # Supabase client & TypeScript types
├── App.tsx                 # Router configuration
├── index.css               # Tailwind directives & custom styles
└── main.tsx                # App entry point
```

## Design System

### Colors
- **Primary**: Dark emerald greens (emerald-500, emerald-600, emerald-900)
- **Secondary**: Teal accents (teal-400, teal-600)
- **Accent**: Deep purple (purple-500, purple-600, purple-900)
- **Background**: Dark gradient (slate-950 → emerald-950 → purple-950)

### Components
- Large rounded corners (rounded-2xl, rounded-3xl)
- Glassmorphism effects with backdrop blur
- Gradient backgrounds and shadows
- Social engagement features (likes, comments)
- Card-based layouts

## Database Schema

- **profiles** - Employee information
- **core_values** - The 5 Evergreen values
- **nominations** - Peer-to-peer nominations
- **channels** - Message channels by department
- **messages** - Team communications
- **magic_moments** - Hospitality spotlight posts
- **magic_moment_likes** - Post engagement
- **magic_moment_comments** - Post comments
- **announcements** - Company announcements

## Future Enhancements

- [ ] Push notifications for announcements
- [ ] Authentication system
- [ ] Admin dashboard for managing awards
- [ ] Analytics and reporting
- [ ] Mobile app version
- [ ] Email digests
- [ ] Advanced search and filtering
- [ ] Gamification features

## License

Proprietary - Evergreen Castle Rock

## Support

For questions or issues, contact the development team.

---

**Built with ❤️ for Evergreen - Creating vibrant and connected communities through relentless hospitality**
