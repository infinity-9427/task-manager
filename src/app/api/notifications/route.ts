import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Mock notifications storage
const notifications: any[] = [
  {
    id: 1,
    title: "Welcome!",
    message: "Welcome to Task Manager! You're all set up and ready to start managing your tasks.",
    type: "info",
    isRead: false,
    userId: 1,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    title: "Welcome Jorge!",
    message: "Welcome to Task Manager! You're all set up and ready to start managing your tasks.",
    type: "info",
    isRead: false,
    userId: 2,
    createdAt: new Date().toISOString()
  }
];

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    try {
      // Verify the JWT token
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Filter notifications for the current user
      const userNotifications = notifications.filter(n => n.userId === decoded.userId);
      
      return NextResponse.json({
        data: userNotifications,
        pagination: {
          page: 1,
          limit: 50,
          total: userNotifications.length,
          totalPages: 1
        }
      });

    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
