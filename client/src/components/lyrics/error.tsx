import { Text, Box, keyframes } from '@chakra-ui/react'

const glitch = keyframes`
  2%, 64% {
    transform: translate(2px, 0) skew(0deg);
  }
  4%, 60% {
    transform: translate(-2px, 0) skew(0deg);
  }
  62% {
    transform: translate(0, 0) skew(5deg);
  }
`

const glitchTop = keyframes`
  2%, 64% {
    transform: translate(2px, -2px);
  }
  4%, 60% {
    transform: translate(-2px, 2px);
  }
  62% {
    transform: translate(13px, -1px) skew(-13deg);
  }
`

const glitchBottom = keyframes`
  2%, 64% {
    transform: translate(-2px, 0);
  }
  4%, 60% {
    transform: translate(-2px, 0);
  }
  62% {
    transform: translate(-22px, 5px) skew(21deg);
  }
`

export const ErrorText = ({ title, error }: { title: string; error: any }) => {
  console.log(error)

  {
    return (
      <Box
        display={'flex'}
        flexDirection={'column'}
        justifyContent={'center'}
        alignItems={'center'}
        textAlign={'center'}
        m={'auto'}
        color={'#cbccd1'}
        fontSize={'44px'}
        font-family={'"Fira Mono", monospace'}
      >
        <Text
          animation={'' + glitch + ' 1s linear infinite'}
          letterSpacing={'-3px'}
          sx={{
            '::before': {
              content: 'attr(' + title + ')',
              position: 'absolute',
              left: '0',

              animation: '' + glitchTop + '  1s linear infinite',
              clipPath: 'polygon(0 0, 100% 0, 100% 33%, 0 33%)',
            },
            '::after': {
              content: 'attr(' + title + ')',
              position: 'absolute',
              left: '0',

              animation: '' + glitchBottom + ' 1.5s linear infinite',
              clipPath: 'polygon(0 67%, 100% 67%, 100% 100%, 0 100%)',
            },
          }}
        >
          {title}
        </Text>
        <Text display={'block'} mt={5} fontSize={'14px'}>
          Ошибка загрузки данных
        </Text>
      </Box>
    )
  }
}
