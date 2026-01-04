import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { hotels } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const data = await db.select().from(hotels);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching hotels:', error);
    return NextResponse.json({ error: 'Failed to fetch hotels' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await db.insert(hotels).values({
      id: body.id,
      name: body.name,
      city: body.city,
      country: body.country,
      rooms: body.rooms,
      phone: body.phone,
      manager: body.manager,
      latitude: body.latitude,
      longitude: body.longitude,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating hotel:', error);
    return NextResponse.json({ error: 'Failed to create hotel' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    await db.update(hotels).set({
      name: body.name,
      city: body.city,
      country: body.country,
      rooms: body.rooms,
      phone: body.phone,
      manager: body.manager,
      latitude: body.latitude,
      longitude: body.longitude,
    }).where(eq(hotels.id, body.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating hotel:', error);
    return NextResponse.json({ error: 'Failed to update hotel' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    
    await db.delete(hotels).where(eq(hotels.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting hotel:', error);
    return NextResponse.json({ error: 'Failed to delete hotel' }, { status: 500 });
  }
}
