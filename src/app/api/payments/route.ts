import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { payments } from '@/lib/db';
import { eq, isNull, or } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, 3);
  if ('response' in auth) {
    return auth.response;
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const showDeleted = searchParams.get('showDeleted') === 'true';
    
    let data;
    if (showDeleted) {
      // Prikaži sve podatke (i obrisane)
      data = await db.select().from(payments);
    } else {
      // Prikaži samo aktivne podatke
      data = await db.select().from(payments).where(or(eq(payments.deleted, false), isNull(payments.deleted)));
    }
    
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
  const auth = requireAuth(request, 2);
  if ('response' in auth) {
    return auth.response;
  }

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
      dueDate: body.dueDate,
      documentType: body.documentType,
      documentNumber: body.documentNumber,
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
  const auth = requireAuth(request, 2);
  if ('response' in auth) {
    return auth.response;
  }

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
      dueDate: body.dueDate,
      documentType: body.documentType,
      documentNumber: body.documentNumber,
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
    const body = await request.json();
    const { id, user, hardDelete } = body;
    const auth = requireAuth(request, hardDelete ? 1 : 2);
    if ('response' in auth) {
      return auth.response;
    }
    
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    
    if (hardDelete) {
      // Trajno brisanje (samo za admin)
      await db.delete(payments).where(eq(payments.id, id));
    } else {
      // Soft delete - označi kao obrisano
      await db.update(payments).set({
        deleted: true,
        deletedAt: new Date(),
        deletedBy: user || 'Unknown',
      }).where(eq(payments.id, id));
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 });
  }
}

// PATCH - Vrati obrisane podatke
export async function PATCH(request: NextRequest) {
  const auth = requireAuth(request, 2);
  if ('response' in auth) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const { id } = body;
    
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    
    await db.update(payments).set({
      deleted: false,
      deletedAt: null,
      deletedBy: null,
    }).where(eq(payments.id, id));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error restoring payment:', error);
    return NextResponse.json({ error: 'Failed to restore payment' }, { status: 500 });
  }
}
