import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { findUserByUsername } from '../mockUserStorage';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Verify and decode the JWT token
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Find the user
      const user = findUserByUsername(decoded.username);
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Return user data without password
      const { password: _, ...userResponse } = user;

      return NextResponse.json({
        user: userResponse
      });

    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
