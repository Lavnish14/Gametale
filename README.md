# 🎮 GameTale - Next-Gen Game Discovery & Review Platform
### 🔴 Live Demo: [https://gametale.games](https://gametale.games)

![Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![Tech Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20Supabase%20%7C%20Tailwind-blue)

**GameTale** is a modern, community-driven platform designed for gamers who want honest, unfiltered opinions. Moving away from outdated 5-star ratings, GameTale introduces a culturally relevant **"Vibe Check"** system where games are rated as **GOAT 🐐** (Greatest of All Time), **MID 😐** (Average), or **TRASH 🗑️** (Poor).

---

## ✨ Key Features

### 1. Unique "Vibe Check" Rating System
- A custom sentiment engine that aggregates user votes into clear, readable verdicts (GOAT/MID/TRASH).
- Visual progress bars showing community consensus at a glance.
- "Trash or Pass" logic designed for Gen-Z gaming culture.

### 2. Comprehensive Game Database
- **Powered by RAWG API:** Access to 800,000+ games with real-time metadata.
- **Trending & Hype:** Dynamic sections for "Trending This Week" and "Upcoming Releases."
- **Video Integration:** Automatic trailer fetching via YouTube Data API.

### 3. User Accounts & Social Features
- **Supabase Authentication:** Secure login/signup system via Email/Password.
- **Wishlist System:** Users can save games to their personal library.
- **Profile Dashboard:** Users can track their reviewed games and voting history.

### 4. Modern UI/UX
- **Dark Mode Aesthetic:** Designed for long browsing sessions with a premium gaming look.
- **Responsive Design:** Fully optimized for Mobile, Tablet, and Desktop.
- **Fast Performance:** Built on Next.js App Router for lightning-fast page loads.

---

## 🛠️ Tech Stack

This project is built using modern, scalable technologies:

- **Frontend:** Next.js 14 (React framework), TypeScript
- **Styling:** Tailwind CSS, Framer Motion (for smooth animations)
- **Backend/Auth:** Supabase (PostgreSQL, Auth, Realtime DB)
- **Data APIs:** RAWG.io API (Game Data), YouTube Data API (Trailers)

---

## 🚀 Getting Started (Installation)

If you bought this code or want to run it locally, follow these steps:

### 1. Clone the Repository
```bash
git clone [https://github.com/Lavnish14/Gametale.git](https://github.com/Lavnish14/Gametale.git)
cd gametale
2. Install Dependencies
Bash

npm install
3. Environment Setup
Create a .env.local file in the root directory. Refer to the ENV_SETUP.md file in this repository for the exact variable names needed. You will need API keys for:

Supabase (URL & Anon Key)

RAWG.io

YouTube Data API v3

4. Run the Server
Bash

npm run dev
Open http://localhost:3000 to view the app.

📂 Project Structure
/src
  ├── /app          # Next.js App Router pages
  ├── /components   # Reusable UI components (Game Cards, Navbar)
  ├── /lib          # API utilities and Supabase clients
  ├── /types        # TypeScript interfaces
/public             # Static assets (Images, Icons)
📩 Contact
For inquiries regarding the purchase of this platform or support, please contact the developer.
