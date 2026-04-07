# 🪙 ExpenseTracker | Smart Financial Management

![Logo](public/logo.png)

A modern, high-performance **Expense Management & Bill Splitting** platform built with Next.js 16 and Supabase. Designed for speed, security, and a premium user experience.

---

## 🚀 Features

### 📊 Personal Finance
- **Real-time Analytics**: Track your spending categories and monthly trends with beautiful interactive charts.
- **Transaction History**: Seamlessly manage and categorize your personal expenses.

### 👥 Group Expenses & Bill Splitting
- **Dynamic Groups**: Create shared spaces for trips, roommates, or dinner bills.
- **Smart Settlements**: Automatically calculates "Who owes Whom" based on shared ledger math.
- **Invite Flow**: Invite friends via secure email OTP or shareable invite links.
- **Real-time Balances**: Instantly see your net position (You Owe / You are Owed) within each group.

### 🛡️ Security & Privacy
- **Supabase Auth**: Secure Google OAuth and Magic Link (OTP) authentication.
- **Row Level Security (RLS)**: Your financial data is strictly yours. Advanced database policies ensure only members can see group ledgers.
- **Encrypted Communication**: All transactions and invites are handled over secure protocols.

---

## 🛠️ Tech Stack

- **Frontend**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Auth**: Supabase Auth (Google & Magic Link)
- **Icons**: Lucide React
- **Dates**: date-fns

---

## 🏁 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/expense-tracker.git
cd expense-tracker
npm install
```

### 2. Environment Variables
Create a `.env.local` file with your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Database Setup
1. Go to your **Supabase SQL Editor**.
2. Run the migration scripts located in [supabase_setup.sql](file:///C:/Users/geeta/.gemini/antigravity/brain/5f938c03-d565-4cf3-999c-6e2b1dcffdfc/supabase_setup.md) and [profiles.sql](file:///C:/Users/geeta/.gemini/antigravity/brain/5f938c03-d565-4cf3-999c-6e2b1dcffdfc/profiles.sql).

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) for the premium experience!

---

## 🚀 Deployment & Auth Configuration

If you're deploying to **Vercel** or **GitHub**, you **MUST** update your Supabase settings to prevent redirects to `localhost:3000`.

### 1. Update Supabase URL Configuration
1. Go to your **Supabase Dashboard** -> **Authentication** -> **URL Configuration**.
2. **Site URL**: This is your production URL (e.g., `https://your-app.vercel.app`).
3. **Redirect URLs**: Add the following:
   - `http://localhost:3000/**` (for development)
   - `https://your-app.vercel.app/**` (for production)
   - `https://your-app.vercel.app/auth/callback` (explicit callback)

### 2. Environment Variables (Production)
Ensure your Vercel (or other host) has these environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 📂 Project Structure

```text
├── src/
│   ├── app/            # App Router & API routes
│   ├── components/     # UI Components (Shadcn + Custom)
│   ├── lib/            # Supabase config & Utilities
│   └── types/          # TypeScript definitions
├── public/             # Static assets & Brand Logo
└── .env.local          # Private credentials (Ignored)
```

---

## 📄 License
This project is licensed under the MIT License.

---

*Designed with ❤️ for modern financial freedom.*
