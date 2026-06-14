'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Email o password non corretti');
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  }

  const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm text-gray-900 bg-white placeholder-gray-400";

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Accedi</h1>
      <p className="text-gray-500 text-sm mb-6">
        Non hai un account?{' '}
        <Link href="/register" className="text-black font-medium underline">
          Registrati
        </Link>
      </p>

      {registered && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 text-sm">✅ Account creato con successo! Accedi ora.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input name="email" type="email" required className={inputClass} placeholder="nome@email.com" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input name="password" type="password" required className={inputClass} placeholder="••••••••" />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-2.5 rounded-lg font-medium text-sm hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Accesso in corso...' : 'Accedi'}
        </button>
      </form>
    </div>
  );
}
