import { Suspense } from 'react';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="h-7 w-32 bg-gray-100 rounded mb-6" />
          <div className="space-y-4">
            <div className="h-11 bg-gray-100 rounded-lg" />
            <div className="h-11 bg-gray-100 rounded-lg" />
            <div className="h-11 bg-gray-200 rounded-lg" />
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
