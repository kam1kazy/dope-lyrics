import { Box, keyframes, css } from '@chakra-ui/react'

interface IParticle {
  size: number
  radius: number
  lapDuration: number
  count: number
  id: number
}

const glitch = keyframes`
  2%, 64% {
    transform: scale(1);
  }
  4%, 60% {
    transform: translate(0, 0) scale(3);
  }
  62% {
    transform: scale(1);
  }
`

const spin = keyframes`
  0% {
    transform: scale(1);
  }
  15% {
    transform: translate(0, 0) scale(3);
  }
  50% {
    transform: scale(1);
  }
`

export const Particle = ({
  radius,
  lapDuration,
  size,
  count,
  id,
}: IParticle) => {
  const angle = ((id + 1) / count) * 360
  const delay = id * (lapDuration / (count - 2))

  return (
    <Box
      as='i'
      display={'block'}
      position={'absolute'}
      opacity={1}
      sx={{
        transform: `rotate(${angle}deg) translate3d(100px, 0, 0)`,
      }}
    >
      <Box
        as='b'
        display={'block'}
        w={size + 'rem'}
        h={size + 'rem'}
        borderRadius={size + 'rem'}
        background={'#cbccd1'}
        boxShadow={'0px 0px 8px #cbccd1'}
        sx={{
          animation: glitch + ' ' + lapDuration + 'ms ease-in-out infinite ',
          animationDelay: delay + 'ms',
        }}
      />
    </Box>
  )
}

export const Spinner = ({
  count,
  duration,
  size,
}: {
  count: number
  duration: number
  size: number
}) => {
  {
    return (
      <Box
        position={'absolute'}
        top={'50%'}
        left={'50%'}
        z-index={'2'}
        sx={{
          perspective: '200px',
        }}
      >
        {Array.from({ length: count }, (_, index) => (
          <Particle
            key={index}
            size={size}
            radius={size}
            count={count}
            lapDuration={duration}
            id={index}
          />
        ))}
      </Box>
    )
  }
}
