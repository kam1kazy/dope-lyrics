'use client';

import { Box, HStack, Image, useDisclosure } from '@chakra-ui/react';

import { DataModal } from '@/features/data-modal';
import { FilterPanel } from '@/features/filter-panel';

export const ControlBar = () => {
  const {
    isOpen: isOpenData,
    onOpen: onOpenData,
    onClose: onCloseData,
  } = useDisclosure();
  const {
    isOpen: isOpenList,
    onOpen: onOpenList,
    onClose: onCloseList,
  } = useDisclosure();

  return (
    <>
      <FilterPanel isOpen={isOpenList} />

      <Box
        borderRadius={'5px'}
        minH={'61px'}
        w={'100%'}
        mt={'auto'}
        boxShadow={'0px 4px 15px -4px rgba(34, 60, 80, 0.15) inset'}
        background={'#0e0f11'}
        zIndex={2}
      >
        <HStack justifyContent={'space-between'} minH={'61px'} p={'0 50px'}>
          <DataModal
            onOpen={onOpenData}
            isOpen={isOpenData}
            onClose={onCloseData}
          />

          <Image
            src="./icons/play.svg"
            maxW={'35px'}
            cursor={'pointer'}
            filter={'drop-shadow(0px 0px 3px #116466);'}
            transition={'filter 0.3s'}
            _hover={{
              filter: 'drop-shadow(0px 0px 3px #f33535);',
            }}
          />

          <Image
            src="./icons/settings.svg"
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
  );
};
