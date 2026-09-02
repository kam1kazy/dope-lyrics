'use client';

import { Box } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { LyricItem, type LyricSlide } from '@/entities/lyric';

interface ViewportProps {
  data: LyricSlide[];
}

export function Viewport({ data }: ViewportProps) {
  const [index, setIndex] = useState(0);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;

    if (!animationComplete) {
      intervalId = setInterval(() => {
        setIndex((prevIndex) => {
          if (prevIndex + 1 >= data.length) {
            return prevIndex;
          }

          return prevIndex + 1;
        });
      }, 2000);
    } else if (index < data.length) {
      setAnimationComplete(true);
    }

    return () => {
      if (intervalId !== undefined) {
        clearInterval(intervalId);
      }
    };
  }, [data.length, animationComplete, index]);

  return (
    <>
      <Box
        position={'relative'}
        overflow={'hidden'}
        h={'481px'}
        w={'100%'}
        m={'auto'}
      >
        {data.slice(0, index + 1).map((item) => (
          <motion.div
            key={item.lyric_id + '_' + item.message?.message_id}
            className="lyric"
            initial={{ opacity: 0, translateY: 500 }}
            animate={{ opacity: [0, 1, 0], translateY: 0 }}
            transition={{ duration: 12, times: [0.2, 0.5, 1] }}
          >
            <LyricItem item={item} />
          </motion.div>
        ))}
      </Box>
    </>
  );
}
