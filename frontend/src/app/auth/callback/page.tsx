import { Suspense } from 'react';
import AuthCallbackContent from './AuthCallbackContent';

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">
      <p className="text-lg">Cargando...</p>
    </div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
