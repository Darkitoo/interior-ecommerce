import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAdminStats } from '@/lib/admin-stats';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }
    if ((session.user as { role?: string }).role !== 'admin') {
      return NextResponse.json({ error: 'Accesso negato' }, { status: 403 });
    }

    const stats = await getAdminStats();
    return NextResponse.json(stats);
  } catch (err) {
    console.error('[GET /api/admin/stats]', err);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
