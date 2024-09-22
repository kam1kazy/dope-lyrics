import { Text, HStack, VStack, Tag, TagLabel } from '@chakra-ui/react'

import { ILyric } from '@server/types/lyric'

type LyricItem = Pick<ILyric, 'message' | 'lyric_id'>

interface LyricItemProps {
  item: LyricItem
}

export const LyricItem = ({ item }: LyricItemProps) => {
  return (
    <VStack spacing={3} key={item.lyric_id}>
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
