import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { forgotPasswordSchema } from '@/lib/validations/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = forgotPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;

    await dbConnect();

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json(
        { message: 'If an account with that email exists, a password reset link has been sent.' },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Save reset token to user
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // In production, you would send an email here
    // For now, we'll just log the reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
    console.log('Password reset URL:', resetUrl);

    // TODO: Implement email sending
    // await sendEmail({
    //   to: user.email,
    //   subject: 'Password Reset Request',
    //   html: `
    //     <p>You requested a password reset.</p>
    //     <p>Click <a href="${resetUrl}">here</a> to reset your password.</p>
    //     <p>This link will expire in 1 hour.</p>
    //   `,
    // });

    return NextResponse.json(
      { 
        message: 'If an account with that email exists, a password reset link has been sent.',
        // Only include in development
        ...(process.env.NODE_ENV === 'development' && { resetUrl }),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
