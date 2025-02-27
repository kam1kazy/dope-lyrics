'use client'

import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    Spinner,
    Stack,
    Text,
    useToast,
} from '@chakra-ui/react'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

const LoginPage = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false);
    const toast = useToast()
    const router = useRouter()
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/";

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const result = await signIn('credentials', {
            redirect: false,
            email,
            password,
            callbackUrl,
        })
        console.log(result)
        if (result?.error) {
            toast({
                title: 'Ошибка авторизации.',
                description: result.error,
                status: 'error',
                duration: 5000,
                isClosable: true,
            })
            console.log(result)
            router.push('/error')
        } else {
            // Успешная авторизация, редирект или дальнейшая логика
            router.push('/')
        }
        setLoading(false)
    }

    return (
        <Box maxW='500px' mx='auto' mt='100px' p={4} borderWidth={1} borderRadius='lg' justifyContent='center' alignItems='center' textAlign='center'>
            <Text fontSize='2xl' mb={14}>
                Авторизация
            </Text>
            <form onSubmit={handleSubmit}>
                <Stack spacing={4}>
                    <FormControl display={'flex'} flexDirection={'column'} alignItems={'center'} justifyContent={'center'}>
                        <FormLabel>Email</FormLabel>
                        <Input
                            type='email'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </FormControl>
                    <FormControl display={'flex'} flexDirection={'column'} alignItems={'center'} justifyContent={'center'}>
                        <FormLabel>Пароль</FormLabel>
                        <Input
                            type='password'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </FormControl>

                    <Button type='submit' w={'100px'} colorScheme='teal' cursor={loading ? 'not-allowed' : 'pointer'} margin={'auto'} mt={14}>
                        Войти
                        {loading && <Spinner size='sm' ml={10} />}
                    </Button>
                </Stack>
            </form>
        </Box >
    )
}

export default LoginPage
