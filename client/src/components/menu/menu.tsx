import { HStack, Image } from '@chakra-ui/react'

export const Menu = () => {
  return (
    <HStack
      spacing={3}
      justifyContent={'space-between'}
      w={'100%'}
      minH={'61px'}
      p={'0 50px'}
      borderRadius={'5px'}
      boxShadow={'0px 12px 19px -4px rgba(34, 60, 80, 0.15) inset'}
      // boxShadow={'0px 5px 50px 12px rgba(34, 60, 80, 1)'}
    >
      <Image
        src='./icons/data-recovery.svg'
        maxW={'18px'}
        cursor={'pointer'}
        filter={'drop-shadow(0px 0px 3px rgba(255, 255, 255, 0.3));'}
        transition={'filter 0.3s'}
        _hover={{
          filter: 'drop-shadow(0px 0px 3px #3b35f3);',
        }}
      />
      <Image
        src='./icons/play.svg'
        maxW={'35px'}
        cursor={'pointer'}
        filter={'drop-shadow(0px 0px 3px #116466);'}
        transition={'filter 0.3s'}
        _hover={{
          filter: 'drop-shadow(0px 0px 3px #f33535);',
        }}
      />
      <Image
        src='./icons/settings.svg'
        maxW={'22px'}
        cursor={'pointer'}
        filter={'drop-shadow(0px 0px 3px rgba(255, 255, 255, 0.5));'}
        transition={'filter 0.3s'}
        _hover={{
          filter: 'drop-shadow(0px 0px 3px #3b35f3);',
        }}
      />
    </HStack>
  )
}
