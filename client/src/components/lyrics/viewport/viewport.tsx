import React, { useState, useEffect } from 'react'
import { useSpring, animated } from '@react-spring/web'
import { ILyric } from '../../../../../server/src/types/lyric'
import { Controls } from './controls'
import { Box } from '@chakra-ui/react'

export function Viewport({ data }: { data: ILyric[] }) {
  const [index, setIndex] = useState(0)
  const [animationComplete, setAnimationComplete] = useState(false)

  useEffect(() => {
    let intervalId: any

    if (!animationComplete) {
      intervalId = setInterval(() => {
        setIndex((prevIndex) => {
          if (prevIndex + 1 >= data.length) {
            return prevIndex // Не увеличиваем индекс после последнего элемента
          }

          return prevIndex + 1
        })
      }, 6000) // Задержка в мс соответствует времени анимации
    } else if (index < data.length) {
      setAnimationComplete(true) // Сброс флага анимации, если есть следующий элемент
    }

    return () => clearInterval(intervalId)
  }, [data.length, animationComplete, index])

  const [props, api] = useSpring(
    () => ({
      from: { opacity: 0, translateY: 500 },
      to: async (next) => {
        await next({ opacity: 1, translateY: 0 })
      },
      config: { duration: 6000 },
    }),
    []
  )

  return (
    <>
      <Controls pause={api.pause} resume={api.resume} count={index} />
      <br />
      <br />
      <Box
        position={'relative'}
        overflow={'hidden'}
        h={'400px'}
        w={'100%'}
        m={'auto'}
      >
        {data.slice(0, index + 1).map((item) => {
          console.log('index: ' + index)

          return (
            <animated.div key={item.lyric_id} className='lyric' style={props}>
              {item.message?.text}
            </animated.div>
          )
        })}
      </Box>
    </>
  )
}
