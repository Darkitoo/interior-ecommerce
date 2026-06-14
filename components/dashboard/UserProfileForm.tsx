'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

interface UserData {
  name: string;
  email: string;
  phone: string | null;
}

interface ProfileFormValues {
  name: string;
  phone: string;
}

const formSchema = z.object({
  name: z.string().min(1, 'Il nome è obbligatorio'),
  phone: z.string().max(20, 'Massimo 20 caratteri').optional(),
});

export default function UserProfileForm({ user }: { user: UserData }) {
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    defaultValues: {
      name: user.name,
      phone: user.phone ?? '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setSaved(false);
    clearErrors();

    const cleaned = {
      name: values.name.trim(),
      phone: values.phone?.trim() || undefined,
    };

    const result = formSchema.safeParse(cleaned);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ProfileFormValues | undefined;
        if (field) setError(field, { message: issue.message });
      }
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError(data.error ?? 'Errore durante il salvataggio');
        return;
      }
      setSaved(true);
    } catch {
      setFormError('Errore di rete');
    } finally {
      setSubmitting(false);
    }
  });

  const inputClass =
    'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5 max-w-lg">
      {formError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {formError}
        </div>
      )}
      {saved && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          Salvato
        </div>
      )}

      <div>
        <label className={labelClass}>Email</label>
        <input
          className={`${inputClass} bg-gray-50 text-gray-500`}
          value={user.email}
          readOnly
          disabled
        />
      </div>

      <div>
        <label className={labelClass}>Nome *</label>
        <input className={inputClass} {...register('name')} />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label className={labelClass}>Telefono</label>
        <input className={inputClass} {...register('phone')} placeholder="+39 …" />
        {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="bg-black text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {submitting ? 'Salvataggio…' : 'Salva'}
      </button>
    </form>
  );
}
