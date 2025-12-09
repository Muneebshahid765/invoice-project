import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import dbConnect from '@/lib/db';
import User from '@/models/User';

// Admin authentication middleware
export async function requireAdmin(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return { error: 'Unauthorized', status: 401 };
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return { error: 'Invalid token', status: 401 };
    }

    await dbConnect();
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return { error: 'User not found', status: 404 };
    }

    if (user.role !== 'admin') {
      return { error: 'Admin access required', status: 403 };
    }

    return { user, userId: decoded.userId };
  } catch (error) {
    console.error('Admin auth error:', error);
    return { error: 'Authentication failed', status: 500 };
  }
}

// Helper to create admin response
export function adminResponse(data, status = 200) {
  return NextResponse.json(data, { status });
}

// Helper to create error response
export function adminError(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
