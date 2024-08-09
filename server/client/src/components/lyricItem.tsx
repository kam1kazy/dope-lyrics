import { Text, HStack, VStack, Tag, TagLabel, CloseButton } from '@chakra-ui/react'

interface LyricItemProps {
  id: number
  text: string
  word_count: number
  hashtags: string[]
}

export const LyricItem = ({ id, text, word_count, hashtags }: LyricItemProps) => {
  return (
    <VStack spacing={3}>
      <HStack spacing={4}>
        {hashtags.map((tag) => (
          <Tag size={tag} key={tag} variant='subtle' colorScheme='cyan'>
            <TagLabel>#{tag}</TagLabel>
          </Tag>
        ))}
      </HStack>

      <HStack spacing={4}>
        <Text>{text}</Text>
        <CloseButton />
      </HStack>
    </VStack>
  )
}
