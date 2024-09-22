import {
  Text,
  HStack,
  VStack,
  Tag,
  TagLabel,
  CloseButton,
} from '@chakra-ui/react'

import { ILyric } from '@server/types/lyric'

type LyricItem = Pick<ILyric, 'message'>

interface LyricItemProps {
  id: number
  item: LyricItem
}

export const LyricItem = ({ id, item }: LyricItemProps) => {
  return (
    <VStack spacing={3} key={id}>
      <HStack spacing={4}>
        {item.message?.hashtags
          ? item.message.hashtags.tags.map((tag, index) => {
              return (
                <Tag
                  size={tag}
                  key={tag + '_' + index}
                  variant='subtle'
                  colorScheme='cyan'
                >
                  <TagLabel p={'3px 5px'} cursor={'default'}>
                    #{tag}
                  </TagLabel>
                </Tag>
              )
            })
          : 'No hashtags'}
      </HStack>

      <HStack spacing={4}>
        <Text whiteSpace='pre-wrap'>{item.message?.text}</Text>
        {/* <CloseButton /> */}
      </HStack>
    </VStack>
  )
}
