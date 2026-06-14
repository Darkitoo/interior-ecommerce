import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/orders', label: 'I miei ordini' },
  { href: '/dashboard/profile', label: 'Profilo' },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
              STUDIO<span className="text-gray-400 font-light">DESIGN</span>
            </Link>
            <span className="text-sm text-gray-500">{session.user.name}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        <aside className="md:w-56 shrink-0">
          <nav className="flex md:flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-white hover:text-gray-900 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
