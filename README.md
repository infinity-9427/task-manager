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
   Edit `.env.local` and set your API URL:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:3200
   ```

3. **Start development server:**
   ```bash
   pnpm dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Production Deployment

1. **Set up production environment:**
   ```bash
   cp .env.production.example .env.production
   ```

2. **Configure environment variables:**
   ```bash
   # Required: Set your backend API URL
   NEXT_PUBLIC_API_URL=https://your-api-domain.com
   
   # Required: Set a secure JWT secret
   JWT_SECRET=your-super-secure-jwt-secret-key
   
   # Optional: Set your app URL
   NEXT_PUBLIC_APP_URL=https://your-app-domain.com
   ```

3. **Build and deploy:**
   ```bash
   pnpm build
   pnpm start
   ```

## Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes | `https://api.example.com` |
| `JWT_SECRET` | JWT signing secret | Yes | `your-secure-secret` |
| `NEXT_PUBLIC_APP_URL` | Frontend app URL | No | `https://app.example.com` |

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

## API Integration

This application connects to an external backend API. Make sure your backend provides the following endpoints:

- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/notifications` - Get notifications
- `GET /api/users` - Get users list
- `POST /api/messages` - Send messages

## Security

- All API requests are authenticated using JWT tokens
- Tokens are stored securely in httpOnly cookies and localStorage
- CORS is configured for production domains
- Environment variables are used for sensitive configuration
