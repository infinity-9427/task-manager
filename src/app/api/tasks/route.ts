import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Mock tasks storage
let tasks: any[] = [
  {
    id: 1,
    title: "Welcome to Task Manager",
    description: "This is a sample task to get you started. You can create, edit, and manage your tasks here.",
    status: "PENDING",
    priority: "MEDIUM",
    createdById: 1,
    assignedToId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

let nextTaskId = 2;

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
      
      // Return tasks (in a real app, filter by user permissions)
      return NextResponse.json({
        data: tasks,
        pagination: {
          page: 1,
          limit: 50,
          total: tasks.length,
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
    console.error('Tasks fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const body = await request.json();

    try {
      // Verify the JWT token
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Create new task
      const newTask = {
        id: nextTaskId++,
        title: body.title,
        description: body.description || '',
        status: body.status || 'PENDING',
        priority: body.priority || 'MEDIUM',
        createdById: decoded.userId,
        assignedToId: body.assignedToId || decoded.userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      tasks.push(newTask);

      return NextResponse.json(newTask, { status: 201 });

    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('Task creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
