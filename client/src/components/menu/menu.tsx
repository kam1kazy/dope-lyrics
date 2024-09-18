import { HStack, Image, useDisclosure, Box } from '@chakra-ui/react'
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
    <>
      <SettingList isOpen={isOpenList} />

      <Box
        borderRadius={'5px'}
        minH={'61px'}
        w={'100%'}
        mt={'auto'}
        boxShadow={'0px 4px 15px -4px rgba(34, 60, 80, 0.15) inset'}
        background={'#0e0f11'}
        zIndex={2}
        // boxShadow={'0px 5px 50px 12px rgba(34, 60, 80, 1)'}
      >
        <HStack justifyContent={'space-between'} minH={'61px'} p={'0 50px'}>
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

          <Image
            src='./icons/settings.svg'
            maxW={'23px'}
            cursor={'pointer'}
            filter={'drop-shadow(0px 0px 3px rgba(255, 255, 255, 0.3));'}
            transition={'filter 0.3s'}
            _hover={{
              filter: 'drop-shadow(0px 0px 3px #3b35f3);',
            }}
            onClick={isOpenList ? onCloseList : onOpenList}
          />
        </HStack>
      </Box>
    </>
  )
}
