'use client'

// COMPONENTS
import Dashboard from '@/components/dashboard'
import { useQuery } from '@apollo/client'
import { userServices } from '@/services'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter()
  const { data, loading, error } = useQuery(userServices.ME)

  console.log('data', data)
  useEffect(() => {
    if (!loading) {
      if (!data || error) {
        router.push('/login');
      }
    }
  }, [data, loading, router]);

  if (loading) return <div>Loading...</div>

  return (
    <Dashboard />
  )
}

