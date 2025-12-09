import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function requireAuth(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Access token is required',
        status: 401,
      };
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return {
        success: false,
        error: 'Invalid or expired access token',
        status: 401,
      };
    }

    await dbConnect();
    const user = await User.findById(decoded.userId);

    if (!user) {
      return {
        success: false,
        error: 'User not found',
        status: 401,
      };
    }

    return {
      success: true,
      user: user,
      decoded: decoded,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Authentication failed',
      status: 500,
    };
  }
}

export async function requireAdmin(request) {
  const authResult = await requireAuth(request);

  if (!authResult.success) {
    return authResult;
  }

  if (authResult.user.role !== 'admin') {
    return {
      success: false,
      error: 'Admin access required',
      status: 403,
    };
  }

  return authResult;
}

export function createAuthResponse(authResult) {
  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }
  return null;
}
