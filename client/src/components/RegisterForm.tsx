import { useMutation } from '@apollo/client';
import { Box, Button, FormControl, FormLabel, Input, VStack, Text } from '@chakra-ui/react';
import { CREATE_USER } from '../server/querys/auth';
import { useState } from 'react';

export const RegisterForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [createUser, { loading, error, data }] = useMutation(CREATE_USER);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUser({ variables: { email, password, name } });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box p={4} maxW="md" mx="auto">
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl>
            <FormLabel>Email</FormLabel>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </FormControl>
          <FormControl>
            <FormLabel>Пароль</FormLabel>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </FormControl>
          <FormControl>
            <FormLabel>Имя</FormLabel>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </FormControl>
          <Button type="submit" colorScheme="teal" isLoading={loading}>
            Зарегистрироваться
          </Button>
          {error && <Text color="red">{error.message}</Text>}
          {data && <Text color="green">Регистрация успешна! ID: {data.createUser.id}</Text>}
        </VStack>
      </form>
    </Box>
  );
};