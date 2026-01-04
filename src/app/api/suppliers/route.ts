import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { suppliers } from '@/lib/db';
import { eq, isNull, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const showDeleted = searchParams.get('showDeleted') === 'true';
    
    let data;
    if (showDeleted) {
      data = await db.select().from(suppliers);
    } else {
      data = await db.select().from(suppliers).where(or(eq(suppliers.deleted, false), isNull(suppliers.deleted)));
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await db.insert(suppliers).values({
      id: body.id,
      name: body.name,
      email: body.email,
      phone: body.phone,
      address: body.address,
      bankAccount: body.bankAccount,
      contactPerson: body.contactPerson,
      latitude: body.latitude,
      longitude: body.longitude,
      country: body.country,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    await db.update(suppliers).set({
      name: body.name,
      email: body.email,
      phone: body.phone,
      address: body.address,
      bankAccount: body.bankAccount,
      contactPerson: body.contactPerson,
      latitude: body.latitude,
      longitude: body.longitude,
      country: body.country,
    }).where(eq(suppliers.id, body.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating supplier:', error);
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, user, hardDelete } = body;
    
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    
    if (hardDelete) {
      await db.delete(suppliers).where(eq(suppliers.id, id));
    } else {
      await db.update(suppliers).set({
        deleted: true,
        deletedAt: new Date(),
        deletedBy: user || 'Unknown',
      }).where(eq(suppliers.id, id));
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 });
  }
}

// PATCH - Vrati obrisane podatke
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;
    
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    
    await db.update(suppliers).set({
      deleted: false,
      deletedAt: null,
      deletedBy: null,
    }).where(eq(suppliers.id, id));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error restoring supplier:', error);
    return NextResponse.json({ error: 'Failed to restore supplier' }, { status: 500 });
  }
}
