'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { REGISTER } from '@/server/querys/auth';
import { 
  Box, 
  Button, 
  FormControl, 
  FormLabel, 
  Input, 
  VStack, 
  Text, 
  Heading, 
  useToast 
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [register, { loading }] = useMutation(REGISTER);
  const toast = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Отправляемые данные:', { email, password, name });
    try {
      const { data } = await register({ variables: { email, password, name } });
      console.log('Ответ сервера:', data);
      if (data?.register?.token) {
        localStorage.setItem('token', data.register.token);
        toast({ 
          title: 'Регистрация успешна', 
          status: 'success', 
          duration: 3000, 
          isClosable: true 
        });
        router.push('/');
      }
    } catch (error: any) {
      console.error('Ошибка регистрации:', error);
      // Добавьте дополнительные детали об ошибке
      if (error.networkError) {
        console.error('Сетевая ошибка:', error.networkError);
      }
      if (error.graphQLErrors) {
        console.error('GraphQL ошибки:', error.graphQLErrors);
      }
      if (error.message) {
        console.error('Ошибка:', error.message);
      }
      toast({ 
        title: 'Ошибка', 
        description: error.message || 'Не удалось зарегистрироваться', 
        status: 'error', 
        duration: 3000, 
        isClosable: true 
      });
    }
  };

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
      <VStack spacing={6} p={8} bg="gray.800" borderRadius="md" shadow="lg" w="sm">
        <Heading size="lg">Регистрация</Heading>
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
              <FormLabel>Имя</FormLabel>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Введите имя"
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
              Зарегистрироваться
            </Button>
          </VStack>
        </form>
        <Text>
          Уже есть аккаунт?{' '}
          <Button variant="link" color="teal.300" onClick={() => router.push('/login')}>
            Войти
          </Button>
        </Text>
      </VStack>
    </Box>
  );
}