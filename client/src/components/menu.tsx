import {
  Text,
  HStack,
  VStack,
  Tag,
  TagLabel,
  CloseButton,
} from '@chakra-ui/react'

export const Menu = () => {
  return (
    <VStack spacing={3}>
      <HStack spacing={4}></HStack>

      <HStack spacing={4}>
        <Text whiteSpace='pre-wrap'>{}</Text>
        {/* <CloseButton /> */}
      </HStack>
    </VStack>
  )
}
