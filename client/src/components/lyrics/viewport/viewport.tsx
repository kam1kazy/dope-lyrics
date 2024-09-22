import React, { useState, useEffect } from 'react'

// STYLES
import { Box } from '@chakra-ui/react'
import { motion } from 'framer-motion'

// COMPONENTS
import { LyricItem } from '../lyricItem'
import { Controls } from './controls'

// TYPES
import { ILyric } from '@server/types/lyric'

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
      }, 2000) // Задержка в мс соответствует времени анимации
    } else if (index < data.length) {
      setAnimationComplete(true) // Сброс флага анимации, если есть следующий элемент
    }

    return () => clearInterval(intervalId)
  }, [data.length, animationComplete, index])

  return (
    <>
      {/* <Controls pause={api.pause} resume={api.resume} count={index} /> */}
      <br />
      <br />
      <Box
        position={'relative'}
        overflow={'hidden'}
        h={'481px'}
        w={'100%'}
        m={'auto'}
      >
        {data.slice(0, index + 1).map((item: any) => (
          <motion.div
            className='lyric'
            initial={{ opacity: 0, translateY: 500 }}
            animate={{ opacity: [0, 1, 0], translateY: 0 }}
            transition={{ duration: 12, times: [0.2, 0.5, 1] }}
          >
            <LyricItem id={item.lyric_id} item={item} />
          </motion.div>
        ))}
      </Box>
    </>
  )
}
