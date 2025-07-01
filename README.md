# Task Manager

A modern task management application built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Task Management**: Create, edit, delete, and organize tasks with priorities and statuses
- **Real-time Collaboration**: Live updates and team chat functionality
- **User Authentication**: Secure login/logout with JWT tokens
- **Responsive Design**: Modern UI that works on desktop and mobile
- **Search & Filter**: Find tasks quickly with advanced search and filtering
- **Notifications**: Real-time notifications for task updates

## Quick Start

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env.local
   ```

3. **Start development server:**
   ```bash
   pnpm dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                 # Next.js app directory
├── components/          # Reusable React components
├── services/           # API service layer
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context
- **Authentication**: JWT tokens
- **Real-time**: Socket.io
- **Package Manager**: pnpm

## Development

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
