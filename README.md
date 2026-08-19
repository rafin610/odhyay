# 📚 ODHYAY

### বাংলা বই পড়ার একটি আধুনিক ডিজিটাল লাইব্রেরি

**ODHYAY** is a modern Bengali digital library and reading platform designed to make Bengali books easier to discover, read, and manage digitally.

The project focuses on creating a calm, distraction-free reading experience with a premium editorial interface, powerful library management, and a foundation that can later support both web and mobile applications.

---

## ✨ Overview

ODHYAY is built around a simple idea:

> **Books should feel like books — even when they live on a screen.**

Instead of treating digital reading like a typical content website, ODHYAY focuses on:

* 📖 Comfortable reading
* 🔎 Fast book discovery
* 🗂️ Organized digital library
* 🔖 Bookmarks & reading progress
* ❤️ Personal favorites
* 🌙 Comfortable dark reading experience
* 📱 Mobile-friendly experience
* ⚡ Fast and responsive interface
* 🧩 Modular architecture for future expansion

---

## 🎯 Project Goals

ODHYAY aims to become a complete digital reading ecosystem for Bengali readers.

### Core goals

* Build a beautiful Bengali-first reading experience
* Make digital books easy to discover
* Provide a distraction-free reading interface
* Track reading progress
* Support bookmarks and favorites
* Create a scalable book/library architecture
* Prepare the platform for a dedicated mobile application
* Keep the codebase maintainable and easy to extend

---

# 🚀 Features

## 📚 Digital Library

Browse and discover Bengali books through a structured digital library.

Each book can contain:

* Book title
* Author
* Translator
* Category
* Description
* Cover
* PDF/book content
* Reading progress
* Favorites
* Bookmarks
* Metadata

---

## 🔍 Search & Discovery

Find books quickly through the library.

The architecture is designed to support:

* Book title search
* Author search
* Category filtering
* Bengali search
* Banglish search
* Future advanced search

---

## 📖 Reading Experience

ODHYAY is designed around comfortable long-form reading.

The reader focuses on:

* Clean typography
* Generous spacing
* Distraction-free layout
* Reading progress
* Bookmarks
* Resume reading
* Dark reading environment

---

## 🔖 Reading Progress

The platform can track where a reader stopped.

Users can return to a book and continue from their previous reading position.

Example:

```text
শেষবার পড়েছিলেন — পৃষ্ঠা ৪৭
Progress — 15%
```

---

## ❤️ Favorites

Users can save books to their personal favorites/library.

This creates a more personalized reading experience without requiring users to search for the same book repeatedly.

---

## 🔖 Bookmarks

Readers can save important pages for returning later.

The bookmark architecture is designed to support future synchronization across devices.

---

## 🌙 Quiet Editorial UI

ODHYAY uses a design language called:

### Quiet Editorial

The interface intentionally avoids loud visual elements.

The design focuses on:

* Calm colors
* Warm typography
* Generous whitespace
* Minimal UI
* Editorial hierarchy
* Comfortable reading

### Dark Mode

* Charcoal background
* Warm ivory typography
* Amethyst accent

### Light Mode

* Warm paper/sepia background
* Soft warm dark-brown typography
* Amethyst accent

The goal is to make reading feel closer to reading a physical book.

---

# 🧠 Architecture

ODHYAY is designed as a modular application where the UI, business logic, and data access are separated.

```text
┌──────────────────────────────┐
│          UI Layer            │
│   Pages / Components / UX    │
└──────────────┬───────────────┘
               │
               ↓
┌──────────────────────────────┐
│       Application Layer      │
│ Hooks / State / Logic        │
└──────────────┬───────────────┘
               │
               ↓
┌──────────────────────────────┐
│        Service Layer         │
│ Books / Users / Reading      │
│ Favorites / Bookmarks        │
└──────────────┬───────────────┘
               │
               ↓
┌──────────────────────────────┐
│       Backend / Database     │
│ API / Authentication / DB    │
└──────────────────────────────┘
```

This separation is intentional.

The frontend should not depend directly on database implementation details.

---

# 🛠️ Tech Stack

The exact stack may evolve during development, but the project is built around modern web technologies.

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui
* Framer Motion

### Backend

* Node.js
* Express
* tRPC

### Data & Infrastructure

* Supabase
* PostgreSQL
* Supabase Storage
* Authentication

### Development

* Git
* GitHub
* ESLint
* Prettier
* Vite

---

# 📁 Project Structure

A simplified structure:

```text
odhyay/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   ├── context/
│   ├── lib/
│   ├── types/
│   └── ...
│
├── public/
│
├── api/
│
├── supabase/
│   └── schema.sql
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.*
└── README.md
```

The exact structure may change as the project evolves.

---

# ⚙️ Getting Started

## Prerequisites

Make sure you have installed:

* Node.js
* npm / pnpm
* Git

Check your versions:

```bash
node -v
npm -v
git --version
```

---

## 1. Clone the repository

```bash
git clone https://github.com/rafin610/odhyay.git
```

Move into the project:

```bash
cd odhyay
```

---

## 2. Install dependencies

```bash
npm install
```

or, if the project uses pnpm:

```bash
pnpm install
```

---

## 3. Environment Variables

Create a local environment file:

```bash
.env
```

Add the required project variables.

Example:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Never commit private keys, service-role keys, or other secrets to GitHub.

---

# ▶️ Run Locally

Start the development server:

```bash
npm run dev
```

or:

```bash
pnpm dev
```

Then open the local development URL shown in your terminal.

---

# 🗄️ Database

ODHYAY uses a backend database for persistent application data.

Typical entities include:

```text
Users
Authors
Categories
Books
Reading Progress
Favorites
Bookmarks
```

Database schema and migrations should be managed separately from frontend UI logic.

---

# 🔐 Authentication

Authentication is designed to support authenticated users and protected user-specific functionality.

User-specific information may include:

* Favorites
* Bookmarks
* Reading progress
* Profile information

Authentication implementation should remain isolated from the UI so it can evolve independently.

---

# 📦 Storage

Book-related assets such as:

* PDF files
* Cover images
* Other media

should be handled through dedicated storage infrastructure rather than being embedded directly into the frontend application.

---

# 📱 Future Mobile Application

ODHYAY is designed with a future dedicated mobile application in mind.

The planned mobile application will use:

```text
ODHYAY Web
      │
      ├─────────────┐
      ↓             ↓
   ODHYAY API   ODHYAY Mobile
      │             │
      └──────┬──────┘
             ↓
        Same Backend
             ↓
        Same Database
```

The mobile application will focus heavily on:

* Offline reading
* Secure app-private book storage
* Reading progress
* Bookmarks
* Favorites
* Mobile-first reading UX

The web and mobile applications are intended to share the same backend ecosystem.

---

# 🎨 Design Philosophy

ODHYAY follows a **Quiet Editorial** design philosophy.

The interface is intentionally restrained.

Instead of maximizing visual elements, the design prioritizes:

### Readability

Typography should remain comfortable during long reading sessions.

### Hierarchy

Important information should be immediately understandable.

### Whitespace

Space is treated as part of the interface.

### Calmness

The UI should not compete with the book.

### Consistency

Colors, typography, spacing, components, and interactions should follow a unified system.

---

# 🧩 Development Principles

When contributing to ODHYAY, follow these principles:

### 1. Keep components small

Avoid large components containing unrelated logic.

### 2. Separate business logic

Move reusable logic into hooks/services instead of placing everything inside pages.

### 3. Keep data access abstracted

Components should not directly depend on database implementation.

### 4. Reuse existing components

Before creating a new UI component, check whether an existing component can be reused.

### 5. Maintain Bengali typography

Never introduce styling that causes Bengali glyph clipping or broken line-height.

### 6. Preserve the design language

New screens should feel like part of ODHYAY.

### 7. Avoid unnecessary dependencies

Only add a dependency when it provides meaningful value.

---

# 🧪 Quality & Testing

Before pushing changes, check:

```bash
npm run build
```

Also verify:

* TypeScript compilation
* Production build
* Responsive layouts
* Dark mode
* Light mode
* Navigation
* Authentication flows
* Book loading
* Reading progress
* Favorites
* Bookmarks
* Error states
* Loading states

---

# 🚧 Roadmap

## Phase 1 — Foundation

* [x] Core web application
* [x] Library interface
* [x] Book discovery
* [x] Reading experience
* [x] Responsive UI
* [x] Theme system
* [x] Backend architecture

## Phase 2 — Platform Improvements

* [ ] Advanced search
* [ ] Better recommendations
* [ ] Improved reading experience
* [ ] Enhanced bookmarks
* [ ] Reading statistics
* [ ] Improved admin controls

## Phase 3 — Mobile

* [ ] Dedicated Expo/React Native application
* [ ] Offline book downloads
* [ ] App-private book storage
* [ ] Mobile PDF reader
* [ ] Reading synchronization
* [ ] Cross-device progress

## Phase 4 — ODHYAY Ecosystem

* [ ] Unified web + mobile experience
* [ ] Cross-device library
* [ ] Personalized recommendations
* [ ] Advanced reader tools
* [ ] More content formats
* [ ] Subscription/premium features where appropriate

---

# 🔮 Future Reader Features

Potential future features include:

* AI-powered book summaries
* Ask questions about books
* Translation
* AI explanations
* Notes
* Highlights
* Advanced search inside books
* Reading statistics
* Personalized recommendations

These features are intentionally kept modular so they can be introduced without disrupting the core reading experience.

---

# 🤝 Contributing

ODHYAY is currently under active development.

Before making significant changes:

1. Understand the existing architecture.
2. Check existing components/services.
3. Keep changes focused.
4. Preserve the design system.
5. Test the affected flows.
6. Make sure production builds successfully.

---

# 📄 License

The licensing model for ODHYAY is currently under development.

Unless explicitly permitted, do not redistribute copyrighted books, PDFs, or other protected content.

---

# 👨‍💻 Project

**ODHYAY**

A Bengali digital library built around a simple idea:

> **Read quietly. Discover deeply.**

---

### Status

🟡 **Active Development**

ODHYAY is continuously evolving as the platform's architecture, reading experience, and ecosystem are improved.

