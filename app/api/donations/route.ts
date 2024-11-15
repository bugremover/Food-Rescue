import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { authOptions } from '../auth/[...nextauth]/route';
import { randomUUID } from 'crypto';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { type, quantity, expiry, notes } = body;
    const id = randomUUID();

    const donation = db.prepare(`
      INSERT INTO donations (id, type, quantity, expiry, notes, businessId, donorId)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `).get(id, type, quantity, new Date(expiry).toISOString(), notes, session.user.businessId, session.user.id);

    const business = db.prepare('SELECT * FROM businesses WHERE id = ?')
      .get(donation.businessId);
    
    const donor = db.prepare('SELECT id, name, email FROM users WHERE id = ?')
      .get(donation.donorId);

    return NextResponse.json({ ...donation, business, donor });
  } catch (error) {
    console.error('[DONATIONS_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');
    const status = searchParams.get('status');

    let query = 'SELECT * FROM donations WHERE 1=1';
    const params = [];

    if (businessId) {
      query += ' AND businessId = ?';
      params.push(businessId);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY createdAt DESC';

    const donations = db.prepare(query).all(...params);

    const enrichedDonations = donations.map(donation => {
      const business = db.prepare('SELECT * FROM businesses WHERE id = ?')
        .get(donation.businessId);
      
      const donor = db.prepare('SELECT id, name, email FROM users WHERE id = ?')
        .get(donation.donorId);

      const claimer = donation.claimerId 
        ? db.prepare('SELECT id, name, email FROM users WHERE id = ?')
            .get(donation.claimerId)
        : null;

      return { ...donation, business, donor, claimer };
    });

    return NextResponse.json(enrichedDonations);
  } catch (error) {
    console.error('[DONATIONS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}