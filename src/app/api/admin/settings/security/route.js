import { NextResponse } from 'next/server';
import { requireAdmin } from '@/middleware/adminAuth';
import dbConnect from '@/lib/db';
import AdminSecuritySettings from '@/models/AdminSecuritySettings';

// GET /api/admin/settings/security - get security settings
export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await dbConnect();
    const settings = await AdminSecuritySettings.getSettings();

    return NextResponse.json({
      settings: {
        requireTwoFactor: settings.requireTwoFactor,
        sessionTimeout: settings.sessionTimeout,
        maxLoginAttempts: settings.maxLoginAttempts,
        ipWhitelist: settings.ipWhitelist,
      },
    });
  } catch (error) {
    console.error('Admin security settings GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/settings/security - update security settings
export async function PUT(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await dbConnect();

    const body = await request.json();
    const {
      requireTwoFactor,
      sessionTimeout,
      maxLoginAttempts,
      ipWhitelist,
    } = body;

    const settings = await AdminSecuritySettings.getSettings();

    if (typeof requireTwoFactor === 'boolean') {
      settings.requireTwoFactor = requireTwoFactor;
    }
    if (typeof sessionTimeout === 'number' && !Number.isNaN(sessionTimeout)) {
      settings.sessionTimeout = sessionTimeout;
    }
    if (typeof maxLoginAttempts === 'number' && !Number.isNaN(maxLoginAttempts)) {
      settings.maxLoginAttempts = maxLoginAttempts;
    }

    if (typeof ipWhitelist === 'string') {
      settings.ipWhitelist = ipWhitelist
        .split(',')
        .map((ip) => ip.trim())
        .filter(Boolean);
    } else if (Array.isArray(ipWhitelist)) {
      settings.ipWhitelist = ipWhitelist.map((ip) => String(ip).trim()).filter(Boolean);
    }

    settings.updatedAt = new Date();
    await settings.save();

    return NextResponse.json({
      message: 'Security settings updated successfully',
      settings: {
        requireTwoFactor: settings.requireTwoFactor,
        sessionTimeout: settings.sessionTimeout,
        maxLoginAttempts: settings.maxLoginAttempts,
        ipWhitelist: settings.ipWhitelist,
      },
    });
  } catch (error) {
    console.error('Admin security settings PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
