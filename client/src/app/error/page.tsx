import { Box, Text, Button } from '@chakra-ui/react'

const ErrorPage = () => {
    return (
        <Box textAlign='center' mt='100px'>
            <Text fontSize='2xl' mb={4}>
                Что-то пошло не так!
            </Text>
            <Text mb={4}>Пожалуйста, попробуйте еще раз.</Text>
            <Button
                colorScheme='teal'
                onClick={() => (window.location.href = '/login')}
            >
                На страницу авторизации
            </Button>
        </Box>
    )
}

export default ErrorPage
