import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { activityLogs } from '@/lib/db';
import { desc } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, 3);
  if ('response' in auth) {
    return auth.response;
  }

  try {
    const data = await db.select().from(activityLogs).orderBy(desc(activityLogs.timestamp));
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, 3);
  if ('response' in auth) {
    return auth.response;
  }
  try {
    const body = await request.json();
    await db.insert(activityLogs).values({
      id: body.id,
      action: body.action,
      details: body.details,
      user: body.user,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating activity log:', error);
    return NextResponse.json({ error: 'Failed to create activity log' }, { status: 500 });
  }
}
