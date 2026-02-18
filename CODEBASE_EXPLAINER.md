# 🍽️ Tablo - Restaurant Booking & Management System

Welcome to **Tablo**! This project is a modern, high-performance web application designed for restaurant owners to manage their floor plans and bookings, and for customers to find and reserve tables easily.

---

## 🚀 Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **Next.js 16** | Main React framework (App Router) |
| **Supabase** | Backend-as-a-Service (Auth, Database, RLS) |
| **TypeScript** | Type-safe development |
| **Tailwind CSS** | Premium styling and responsive design |
| **Framer Motion & GSAP** | Smooth animations and interactive UI |
| **Zustand** | Lightweight client-side state management |
| **Lucide React** | Beautiful, consistent iconography |
| **React Hook Form & Zod** | Form management and validation |

---

## 📁 Project Structure Deep Dive

The codebase follows the modern Next.js structure, organized by functionality:

### 🌐 `app/` (The Core)
This is where the routing and main pages live.
- **`(main)/`**: Public-facing pages (Landing, Restaurant listings, Booking flow).
- **`(dashboard)/`**: Protected routes for restaurant owners to manage their business.
- **`auth/`**: Authentication logic and UI (Login/Signup).
- **`actions/`**: Server Actions for handling data mutations (Forms, Database updates).

### 🧱 `components/`
Reusable UI components built for the design system.
- **`ui/`**: Low-level, generic components (Buttons, Inputs, Dialogs) powered by Radix UI.
- **`floor-plan/`**: Specialized components for the interactive restaurant table layout.
- **`customer/`**: Components specific to the booking experience for guests.

### 🛠️ `lib/`
Utility functions and configuration.
- **`supabase/`**: Clients for server-side and client-side interaction with the database.
- **`utils/`**: Shared helper functions (Currency formatting, class merging).
- **`stores/`**: Zustand stores for handling global app state.

---

## ✨ Key Features

### 1. Interactive Floor Plan
Owners can design their restaurant layout by dragging and dropping tables. This is built with performance in mind, using modern browser APIs to ensure a smooth experience.

### 2. Multi-Language Support (i18n)
Full support for **English** and **Georgian**. The app automatically handles translations and locale-based routing.

### 3. Secure Authentication
Managed via Supabase Auth. Users can sign in as either **Customers** (to book) or **Restaurant Owners** (to manage). Access is controlled through Row Level Security (RLS) in the database.

### 4. Real-time Bookings
The system allows customers to select specific tables and times, receiving instant confirmation and visual feedback.

---

## 🔐 How Security Works

We use **Row Level Security (RLS)** in Supabase. This means:
- You can't see other users' private data.
- Owners can only modify their own restaurant details.
- Every API request is checked against the user's JWT (token) at the database layer.

---

## 🎨 Design Philosophy

Tablo aims for a **Premium** look and feel:
- **Glassmorphism**: Subtle backgrounds and blur effects.
- **Micro-animations**: Tiny interactive cues that make the app feel alive.
- **Responsive Layering**: Tailored views for mobile, tablet, and desktop.

---

### 🛠️ Getting Started (For Developers)

1. Clone the repo.
2. Run `npm install`.
3. Set up your `.env.local` with Supabase credentials.
4. Run `npm run dev` to start the engine!

---
*Created with ❤️ for the Tablo Community.*
