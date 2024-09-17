import { HStack, Image, useDisclosure } from '@chakra-ui/react'
import { useState } from 'react'
import SettingData from './settingData/settingData'
import SettingList from './settingList/settingList'

export const Menu = () => {
  const {
    isOpen: isOpenData,
    onOpen: onOpenData,
    onClose: onCloseData,
  } = useDisclosure()
  const {
    isOpen: isOpenList,
    onOpen: onOpenList,
    onClose: onCloseList,
  } = useDisclosure()

  return (
    <HStack
      spacing={3}
      justifyContent={'space-between'}
      w={'100%'}
      minH={'61px'}
      p={'0 50px'}
      mt={'auto'}
      borderRadius={'5px'}
      boxShadow={'0px 12px 19px -4px rgba(34, 60, 80, 0.15) inset'}
      // boxShadow={'0px 5px 50px 12px rgba(34, 60, 80, 1)'}
    >
      <SettingData
        onOpen={onOpenData}
        isOpen={isOpenData}
        onClose={onCloseData}
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

      <SettingList
        onOpen={onOpenList}
        isOpen={isOpenList}
        onClose={onCloseList}
      />
    </HStack>
  )
}
