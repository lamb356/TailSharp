// src/app/api/admin/waitlist/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';

const ADMIN_SECRET = process.env.ADMIN_SECRET;

export async function GET(request: NextRequest) {
  // Verify admin secret
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  const format = searchParams.get('format'); // 'csv' for export

  if (!ADMIN_SECRET || key !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const redis = new Redis(process.env.KV_REDIS_URL!);

  try {
    // Get all emails from the waitlist set
    const emails = await redis.smembers('waitlist:emails');
    const count = emails.length;

    await redis.quit();

    // Return CSV format if requested
    if (format === 'csv') {
      const csvContent = ['email', ...emails].join('\n');
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="waitlist-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({
      count,
      emails: emails.sort(), // Alphabetically sorted
    });
  } catch (error) {
    console.error('[Admin/Waitlist] Error:', error);
    await redis.quit();
    return NextResponse.json(
      { error: 'Failed to fetch waitlist' },
      { status: 500 }
    );
  }
}

// DELETE - Remove an email from waitlist
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  if (!ADMIN_SECRET || key !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const redis = new Redis(process.env.KV_REDIS_URL!);

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const removed = await redis.srem('waitlist:emails', email.toLowerCase().trim());
    await redis.quit();

    return NextResponse.json({
      success: removed === 1,
      message: removed === 1 ? 'Email removed' : 'Email not found',
    });
  } catch (error) {
    console.error('[Admin/Waitlist] Error:', error);
    await redis.quit();
    return NextResponse.json(
      { error: 'Failed to remove email' },
      { status: 500 }
    );
  }
}
