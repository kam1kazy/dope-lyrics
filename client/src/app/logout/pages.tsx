'use client';

import { useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { authServices } from '@/services';
import { useEffect } from 'react';

export default function LogoutPage() {
  const [logout] = useMutation(authServices.LOGOUT);
  const router = useRouter();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await logout();
        // Очищаем куки вручную (если сервер не сделал это автоматически)
        document.cookie = 'token=; Max-Age=0; path=/; secure; httpOnly';
        document.cookie = 'refresh_token=; Max-Age=0; path=/; secure; httpOnly';
        router.push('/login');
      } catch (error) {
        console.error('Ошибка при выходе:', error);
      }
    };

    handleLogout();
  }, [logout, router]);

  return null;
}