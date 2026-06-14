'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirm = formData.get('confirm') as string;

    if (password !== confirm) {
      setError('Le password non coincidono');
      setLoading(false);
      return;
    }

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Errore durante la registrazione');
      setLoading(false);
      return;
    }

    router.push('/login?registered=true');
  }

  const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm text-gray-900 bg-white placeholder-gray-400";

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Crea account</h1>
      <p className="text-gray-500 text-sm mb-6">
        Hai già un account?{' '}
        <Link href="/login" className="text-black font-medium underline">
          Accedi
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
          <input name="name" type="text" required className={inputClass} placeholder="Mario Rossi" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input name="email" type="email" required className={inputClass} placeholder="nome@email.com" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input name="password" type="password" required minLength={8} className={inputClass} placeholder="Minimo 8 caratteri" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Conferma password</label>
          <input name="confirm" type="password" required className={inputClass} placeholder="••••••••" />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-2.5 rounded-lg font-medium text-sm hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Creazione in corso...' : 'Crea account'}
        </button>
      </form>
    </div>
  );
}
