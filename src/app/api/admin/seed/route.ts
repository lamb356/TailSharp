// src/app/api/admin/seed/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { seedDemoData, clearDemoData } from '@/scripts/seedDemoData';

const ADMIN_SECRET = process.env.ADMIN_SECRET;

// POST /api/admin/seed - Run the seed script
export async function POST(request: NextRequest) {
  // Verify admin secret
  const authHeader = request.headers.get('authorization');
  const providedSecret = authHeader?.replace('Bearer ', '');

  if (!ADMIN_SECRET) {
    return NextResponse.json(
      { error: 'ADMIN_SECRET not configured' },
      { status: 500 }
    );
  }

  if (providedSecret !== ADMIN_SECRET) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const redisUrl = process.env.KV_REDIS_URL;
  if (!redisUrl) {
    return NextResponse.json(
      { error: 'Redis URL not configured' },
      { status: 500 }
    );
  }

  try {
    // Check if clear flag is set
    const { searchParams } = new URL(request.url);
    const shouldClear = searchParams.get('clear') === 'true';

    if (shouldClear) {
      await clearDemoData(redisUrl);
      return NextResponse.json({
        success: true,
        message: 'Demo data cleared successfully',
      });
    }

    // Run seed
    const result = await seedDemoData(redisUrl);

    return NextResponse.json({
      success: true,
      message: 'Demo data seeded successfully',
      ...result,
    });
  } catch (error) {
    console.error('[Admin/Seed] Error:', error);
    return NextResponse.json(
      { error: 'Failed to seed data', details: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/admin/seed - Check seed status (also protected)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const providedSecret = authHeader?.replace('Bearer ', '');

  if (!ADMIN_SECRET || providedSecret !== ADMIN_SECRET) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    status: 'ready',
    endpoints: {
      seed: 'POST /api/admin/seed - Seeds demo data',
      clear: 'POST /api/admin/seed?clear=true - Clears all demo data',
    },
    note: 'Include Authorization: Bearer YOUR_ADMIN_SECRET header',
  });
}
