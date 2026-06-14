import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import UserProfileForm from '@/components/dashboard/UserProfileForm';

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { name: true, email: true, phone: true, createdAt: true },
  });

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profilo</h1>
        <p className="text-sm text-gray-500">
          Membro dal {new Date(user.createdAt).toLocaleDateString('it-IT')}
        </p>
      </div>
      <UserProfileForm
        user={{ name: user.name, email: user.email, phone: user.phone }}
      />
    </div>
  );
}
