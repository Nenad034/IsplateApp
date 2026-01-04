import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { payments } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const data = await db.select().from(payments);
    const parsedData = data.map(p => ({
      ...p,
      reservations: p.reservations ? JSON.parse(p.reservations) : []
    }));
    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await db.insert(payments).values({
      id: body.id,
      supplierId: body.supplierId,
      hotelId: body.hotelId,
      amount: body.amount,
      currency: body.currency,
      date: body.date,
      description: body.description,
      status: body.status,
      method: body.method,
      bankName: body.bankName,
      serviceType: body.serviceType,
      realizationYear: body.realizationYear,
      reservations: JSON.stringify(body.reservations || []),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    await db.update(payments).set({
      supplierId: body.supplierId,
      hotelId: body.hotelId,
      amount: body.amount,
      currency: body.currency,
      date: body.date,
      description: body.description,
      status: body.status,
      method: body.method,
      bankName: body.bankName,
      serviceType: body.serviceType,
      realizationYear: body.realizationYear,
      reservations: JSON.stringify(body.reservations || []),
    }).where(eq(payments.id, body.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    
    await db.delete(payments).where(eq(payments.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 });
  }
}
