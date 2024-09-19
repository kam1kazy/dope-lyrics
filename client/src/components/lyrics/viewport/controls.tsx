import React, { useState, useEffect } from 'react'
import { Button, HStack } from '@chakra-ui/react'
import { useSpring, animated } from '@react-spring/web'
import { ILyric } from '../../../../../server/src/types/lyric'

export function Controls({
  pause,
  resume,
  count,
}: {
  pause: () => void
  resume: () => void
  count: number
}) {
  return (
    <>
      <p>Элементов на экране: {count + 1}</p>
      <HStack>
        <Button
          onClick={() => pause}
          _hover={{
            backgroundColor: '#afadad   ',
            filter: 'drop-shadow(0px 0px 3px #fff);',
          }}
        >
          {'pause'}
        </Button>
        <Button
          onClick={() => resume}
          _hover={{
            backgroundColor: '#afadad   ',
            filter: 'drop-shadow(0px 0px 3px #8435f3);',
          }}
        >
          {'resume'}
        </Button>
      </HStack>
    </>
  )
}
