import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { addUser, findUserByUsername, findUserByEmail } from '../mockUserStorage';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, firstName, lastName } = body;

    // Basic validation
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      );
    }

    if (username.length < 3 || username.length > 30) {
      return NextResponse.json(
        { error: 'Username must be between 3 and 30 characters' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUserByUsername = findUserByUsername(username);
    const existingUserByEmail = findUserByEmail(email);
    
    if (existingUserByUsername) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      );
    }
    
    if (existingUserByEmail) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Create new user
    const newUser = addUser({
      username,
      email,
      password, // In a real app, this should be hashed
      firstName: firstName || '',
      lastName: lastName || '',
      avatar: null,
      role: 'MEMBER',
      isActive: true,
      isOnline: false,
      lastSeen: null,
      emailVerified: false,
      emailVerificationToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: newUser.id, username: newUser.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: newUser.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password from response
    const { password: _, ...userResponse } = newUser;

    return NextResponse.json({
      message: 'User registered successfully',
      user: userResponse,
      accessToken,
      refreshToken
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
