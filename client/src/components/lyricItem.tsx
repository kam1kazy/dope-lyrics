import {
  Text,
  HStack,
  VStack,
  Tag,
  TagLabel,
  CloseButton,
} from '@chakra-ui/react'

interface LyricItemProps {
  id: number
  text: string
  data: string
  replyToMessage: number
  message: {
    text: string
    word_count: number
    hashtags?: {
      id: number
      tags?: string[]
      count: number
    }
  }
}

export const LyricItem = ({ id, message }: LyricItemProps) => {
  console.log(message)

  return (
    <VStack spacing={3} key={id}>
      <HStack spacing={4}>
        {message.hashtags != null
          ? message.hashtags.tags?.map((tag, index) => {
              console.log(message.hashtags)

              return (
                <Tag
                  size={tag}
                  key={tag + '_' + index}
                  variant='subtle'
                  colorScheme='cyan'
                >
                  <TagLabel>#{tag}</TagLabel>
                </Tag>
              )
            })
          : 'No hashtags'}
      </HStack>

      <HStack spacing={4}>
        <Text>{message.text}</Text>
        <CloseButton />
      </HStack>
    </VStack>
  )
}
