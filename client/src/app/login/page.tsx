import { useState } from 'react'
import { signIn } from 'next-auth/react'
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    Stack,
    Text,
    useToast,
} from '@chakra-ui/react'

const LoginPage = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const toast = useToast()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const result = await signIn('credentials', {
            redirect: false,
            email,
            password,
        })
        if (result?.error) {
            toast({
                title: 'Ошибка авторизации.',
                description: result.error,
                status: 'error',
                duration: 5000,
                isClosable: true,
            })
        } else {
            // Успешная авторизация, редирект или дальнейшая логика
            window.location.href = '/error'
        }
    }

    return (
        <Box maxW='md' mx='auto' mt='100px' p={4} borderWidth={1} borderRadius='lg'>
            <Text fontSize='2xl' mb={4}>
                Авторизация
            </Text>
            <form onSubmit={handleSubmit}>
                <Stack spacing={4}>
                    <FormControl>
                        <FormLabel>Email</FormLabel>
                        <Input
                            type='email'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </FormControl>
                    <FormControl>
                        <FormLabel>Пароль</FormLabel>
                        <Input
                            type='password'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </FormControl>
                    <Button type='submit' colorScheme='teal'>
                        Войти
                    </Button>
                </Stack>
            </form>
        </Box>
    )
}

export default LoginPage
