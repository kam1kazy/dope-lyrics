// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { LOGIN } from '@/server/querys/auth';
import { Box, Button, FormControl, FormLabel, Input, VStack, Text, Heading, useToast } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [login, { loading }] = useMutation(LOGIN);
  const toast = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    try {
      const { data } = await login({ variables: { email, password } });
      if (data?.login?.token) {
        localStorage.setItem('token', data.login.token);
        toast({ title: 'Успешный вход', status: 'success', duration: 3000, isClosable: true });
        router.push('/dashboard');
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Неверные данные', status: 'error', duration: 3000, isClosable: true });
    }
  };

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
      <VStack spacing={6} p={8} bg="gray.800" borderRadius="md" shadow="lg" w="sm">
        <Heading size="lg">Вход</Heading>
        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Введите email"
                bg="gray.700"
                border="none"
                _focus={{ boxShadow: 'outline' }}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Пароль</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                bg="gray.700"
                border="none"
                _focus={{ boxShadow: 'outline' }}
              />
            </FormControl>
            <Button type="submit" colorScheme="teal" w="full" isLoading={loading}>
              Войти
            </Button>
          </VStack>
        </form>
        <Text>
          Нет аккаунта?{' '}
          <Button variant="link" color="teal.300" onClick={() => router.push('/register')}>
            Зарегистрироваться
          </Button>
        </Text>
      </VStack>
    </Box>
  );
}