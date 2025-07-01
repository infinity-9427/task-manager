# Task Manager - Developer Guidelines

## 📋 Table of Contents
- [Overview](#overview)
- [API Documentation](#api-documentation)
- [Environment Setup](#environment-setup)
- [Recent Changes](#recent-changes)
- [Development Considerations](#development-considerations)
- [Authentication Flow](#authentication-flow)
- [UI/UX Standards](#uiux-standards)
- [Common Issues & Solutions](#common-issues--solutions)
- [Best Practices](#best-practices)

## 📖 Overview

This is a Next.js 14+ Task Manager application built with:
- **Frontend**: Next.js, TypeScript, React, Tailwind CSS
- **Backend**: Node.js API server
- **Authentication**: JWT-based auth with access/refresh tokens
- **State Management**: React Context API
- **Styling**: Tailwind CSS with custom components

## 🌐 API Documentation

### API Server
- **Local Development**: `http://localhost:3200`
- **API Documentation**: `http://localhost:3200/api-docs`
- **Base API Path**: `/api`
- **Health Check**: `http://localhost:3200/health` (no `/api` prefix)

### Key Endpoints (Verified Working)
```
Authentication:
POST /api/auth/register    - Register new user ✅
POST /api/auth/login       - User login ✅
POST /api/auth/refresh-token - Refresh access token
POST /api/auth/logout      - User logout
GET  /api/auth/me          - Get current user ✅
POST /api/auth/change-password - Change password
POST /api/auth/forgot-password - Forgot password
POST /api/auth/reset-password  - Reset password

Tasks:
POST /api/tasks           - Create new task ✅
GET  /api/tasks           - Get all tasks ✅
GET  /api/tasks/{id}      - Get task by ID
PUT  /api/tasks/{id}      - Update task ✅
DELETE /api/tasks/{id}    - Delete task

Users:
GET  /api/users/{id}      - Get user by ID ✅
POST /api/users           - Create user (Admin only)
PUT  /api/users/{id}      - Update user
DELETE /api/users/{id}    - Delete user (Admin only)

Notifications:
GET  /api/notifications   - Get user notifications ✅
PATCH /api/notifications/{id}/read - Mark as read
PATCH /api/notifications/mark-all-read - Mark all as read
DELETE /api/notifications/{id} - Delete notification

Messaging:
GET  /api/messaging/conversations ✅
POST /api/messaging/conversations - Create conversation
POST /api/messaging/conversations/{id}/messages - Send message
GET  /api/messaging/conversations/{id}/messages - Get messages

Analytics:
GET  /api/analytics/dashboard ✅
GET  /api/analytics/admin-dashboard (Admin only)
GET  /api/analytics/project/{id}
```

### API Data Formats

**Registration Request:**
```json
{
  "username": "string (required, 3-20 chars, alphanumeric + underscore)",
  "email": "string (required, valid email)",
  "password": "string (required, min 6 chars, 1 uppercase, 1 lowercase, 1 number)",
  "firstName": "string (optional)",
  "lastName": "string (optional)"
}
```

**Login Request:**
```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

**Auth Response:**
```json
{
  "message": "Success message",
  "user": {
    "id": number,
    "username": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "avatar": string | null,
    "role": "MEMBER" | "ADMIN" | "MODERATOR",
    "isActive": boolean,
    "isOnline": boolean,
    "lastSeen": string | null,
    "emailVerified": boolean,
    "createdAt": "ISO string",
    "updatedAt": "ISO string"
  },
  "accessToken": "JWT token",
  "refreshToken": "JWT token"
}
```

## ⚙️ Environment Setup

### Prerequisites
- Node.js 18+
- pnpm (preferred package manager)
- Local API server running on port 3200

### Environment Variables
Create a `.env` file in the root directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:3200
```
**Important**: Do NOT include `/api` in the URL - it's automatically appended by the service layer.

### Development Server
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# If having API connection issues, force restart:
pkill -f "next" && pnpm dev

# Access application
Frontend: http://localhost:3000
API Docs: http://localhost:3200/api-docs
```

## 🔄 Recent Changes (July 2025)

### Backend API Integration Verified
- **External API**: Confirmed working at `http://localhost:3200/api`
- **Health Check**: Available at `http://localhost:3200/health` (no API prefix)
- **All Endpoints**: Tested and verified working with JWT authentication
- **Response Format**: Updated documentation with actual API responses
- **Service Layer**: Updated all services to properly connect to backend

### Tested & Working Endpoints
- ✅ Authentication (register, login, me)
- ✅ Tasks (CRUD operations)
- ✅ Users (get by ID, management)
- ✅ Notifications (get notifications with pagination)
- ✅ Analytics (dashboard data)
- ✅ Messaging (conversations endpoint)

### Frontend Service Updates
- **Unified Request Handling**: All services now use consistent request patterns
- **Proper Error Handling**: Backend error messages properly propagated
- **Token Management**: JWT tokens correctly attached to all requests
- **Fallback Support**: Automatic fallback to local mock APIs if backend unavailable

### Internal vs External API
- **External API**: Separate Node.js server at `localhost:3200` (preferred)
- **Internal API**: Next.js API routes at `/api/*` (fallback when external is unavailable)
- **Auto-switching**: The app automatically tries external API first, then falls back to internal mock API
- **Mock Data**: Internal API provides realistic mock responses for development

### Available Internal API Endpoints
When using the internal mock API (fallback):
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login  
- `GET /api/auth/me` - Get current user data
- `GET /api/tasks` - Get user tasks
- `POST /api/tasks` - Create new task
- `GET /api/notifications` - Get user notifications

### Demo Credentials (Internal Mock API)
When using the internal mock API (fallback), you can test with:
- **Demo Login**: username: `demo`, password: `password123`
- **Registration**: Use any unique username/email combination
- **Session Persistence**: Registered users persist during the development session
- **After Registration**: You can immediately login with the credentials you just registered

**Note**: If you registered before the recent fix and can't login, please register again with new credentials.

### UI/UX Polish Updates
- **Input Readability**: Fixed text and placeholder colors for better visibility
- **Selection Behavior**: Added `select-none` to prevent unwanted text selection on labels and titles
- **Password Visibility**: Fixed toggle logic (eye icon when visible, eye-off when hidden)
- **Form Labels**: Added `cursor-pointer` for better UX on label clicks

### Type System Updates
- **User Interface**: Updated to match API response structure
- **Nullable Fields**: Added proper null types for `avatar`, `lastSeen`, etc.
- **Validation**: Enhanced form validation with Zod schemas

## 🛠️ Development Considerations

### Authentication State Management
- Uses React Context (`AuthContext`) for global auth state
- JWT tokens stored in both cookies and localStorage for redundancy
- Automatic token refresh handling
- Persistent login state across browser sessions

### API Service Layer
- Centralized API calls in `src/services/` directory
- **Primary**: External API at `http://localhost:3200/api`
- **Fallback**: Internal Next.js API routes (mock data)
- Automatic token attachment to requests
- Error handling with proper TypeScript types
- Base URL configuration via environment variables

### Service Layer Structure
```
src/services/
├── authService.ts      - Authentication & user management
├── taskService.ts      - Task CRUD operations
├── userService.ts      - User management
├── notificationService.ts - Notifications
├── messagingService.ts - Chat & messaging
├── analyticsService.ts - Dashboard & analytics
└── index.ts           - Centralized exports
```

### Form Validation
- Zod schemas for runtime validation
- Real-time error feedback
- Password strength requirements enforced
- Email format validation

### Responsive Design
- Mobile-first approach with Tailwind CSS
- Consistent spacing and typography
- Accessible form controls and navigation
- Dark mode considerations (placeholder for future implementation)

## 🔐 Authentication Flow

### Registration Process
1. User fills registration form with validation
2. Frontend sends POST to `/api/auth/register`
3. API validates and creates user account
4. Returns user data + JWT tokens
5. Tokens stored in cookies + localStorage
6. User redirected to dashboard

### Login Process
1. User enters username/password
2. Frontend sends POST to `/api/auth/login`
3. API validates credentials
4. Returns user data + JWT tokens
5. Tokens stored and user state updated
6. Redirect to dashboard

### Token Management
- **Access Token**: Short-lived (15 minutes), for API requests
- **Refresh Token**: Long-lived (7 days), for obtaining new access tokens
- **Auto-refresh**: Implemented in API service layer
- **Logout**: Clears all tokens and cookies

## 🎨 UI/UX Standards

### Text Selection & Cursor Behavior
```css
/* Prevent text selection on non-interactive elements */
.select-none { user-select: none; }

/* Allow text selection in inputs */
.select-text { user-select: text; }

/* Pointer cursor on clickable labels */
.cursor-pointer { cursor: pointer; }
```

### Form Input Standards
- Clear placeholder text with sufficient contrast
- Visible text color for readability
- Consistent focus states
- Error states with clear messaging
- Loading states for form submissions

### Color Scheme
- Primary text: `text-gray-900`
- Secondary text: `text-gray-600`
- Placeholder text: `placeholder-gray-400`
- Error text: `text-red-600`
- Success text: `text-green-600`

## ❗ Common Issues & Solutions

### 404 API Errors
**Problem**: Frontend getting "Route not found" errors
**Solution**: The app now has automatic fallback handling
**Behavior**: 
1. Tries external API first (`localhost:3200`)
2. If external API is unavailable, automatically uses internal mock API
3. Check browser console for which API is being used

**Debug Steps**:
1. Check if external API server is running: `curl http://localhost:3200/api/auth/register`
2. If external API is down, the app will use internal mock API automatically
3. Look for console logs: "Trying external API" or "Using local API"
4. Internal mock API works for development and testing

### CORS Issues
**Problem**: Cross-origin requests blocked
**Solution**: Ensure API server has proper CORS configuration
**Check**: API server logs for CORS-related errors

### Token Persistence
**Problem**: User logged out on page refresh
**Solution**: Check both cookies and localStorage are being set
**Debug**: Inspect Application tab in DevTools

### Form Validation Errors
**Problem**: Validation not triggering or incorrect
**Solution**: Check Zod schema matches API requirements
**Verify**: API documentation for exact field requirements

### Styling Issues
**Problem**: Tailwind classes not applying
**Solution**: Check class names are correct and Tailwind is configured
**Build**: Restart dev server if using custom Tailwind config

### Environment Variable Not Loading
**Problem**: Changes to `.env` file not taking effect
**Solution**: 
1. Completely stop all processes: `pkill -f "next" && pkill -f "pnpm"`
2. Wait 2-3 seconds
3. Restart: `pnpm dev`
4. Check browser console for debugging logs showing actual URL
5. Clear browser cache or use incognito mode

### Browser Cache Issues
**Problem**: Frontend still using old API URL despite `.env` changes
**Solution**: 
1. Open Developer Tools (F12)
2. Go to Network tab
3. Check "Disable cache" option
4. Refresh page
5. Or use incognito/private browsing mode

## 📝 Best Practices

### API Integration
- Always use the centralized `authService` for API calls
- Handle loading and error states in components
- Use TypeScript interfaces for API responses
- Validate data with Zod before sending to API

### State Management
- Use React Context for global state (auth, themes)
- Local state for component-specific data
- Custom hooks for reusable stateful logic
- Avoid prop drilling with context providers

### Error Handling
- User-friendly error messages
- Console logging for debugging
- Graceful fallbacks for network issues
- Clear validation feedback

### Code Organization
```
src/
├── app/                    # Next.js app router pages
├── components/             # Reusable UI components
├── services/              # API service layers
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions
└── hooks/                 # Custom React hooks
```

### Git Workflow
- Create feature branches for new work
- Use descriptive commit messages
- Test thoroughly before merging
- Document breaking changes

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)
- [JWT.io](https://jwt.io/) - For debugging JWT tokens

## 🤝 Contributing

1. Check existing issues and PRs
2. Follow the established code style
3. Add tests for new features
4. Update this documentation for significant changes
5. Test with both local and staging APIs

---

**Last Updated**: July 1, 2025  
**Maintainer**: Development Team  
**Questions**: Refer to API documentation or create an issue
