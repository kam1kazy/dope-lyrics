import React, { useState, useEffect } from 'react'

// STYLES
import { Box } from '@chakra-ui/react'
import { motion } from 'framer-motion'

// COMPONENTS
import { LyricItem } from '../lyricItem'

// TYPES
import { ILyric } from '@server/types/lyric'

type LyricItem = Pick<ILyric, 'message' | 'lyric_id'>

interface IViewportLyricList {
  lyric_id: LyricItem['lyric_id']
  message: LyricItem['message']
}

export function Viewport({ data }: { data: any[] }) {
  const [index, setIndex] = useState(0)
  const [animationComplete, setAnimationComplete] = useState(false)

  // Пошаговый дроп Lyrics
  useEffect(() => {
    let intervalId: Timer

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
      <Box
        position={'relative'}
        overflow={'hidden'}
        h={'481px'}
        w={'100%'}
        m={'auto'}
      >
        {data.slice(0, index + 1).map((item: IViewportLyricList) => (
          <motion.div
            key={item.lyric_id + '_' + item.message?.message_id}
            className='lyric'
            initial={{ opacity: 0, translateY: 500 }}
            animate={{ opacity: [0, 1, 0], translateY: 0 }}
            transition={{ duration: 12, times: [0.2, 0.5, 1] }}
          >
            <LyricItem item={item} />
          </motion.div>
        ))}
      </Box>
    </>
  )
}
