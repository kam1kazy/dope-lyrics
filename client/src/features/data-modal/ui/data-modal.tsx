'use client';

import {
  Button,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react';
import type { RefObject } from 'react';

interface DataModalProps {
  onOpen: () => void;
  isOpen: boolean;
  onClose: () => void;
  containerRef?: RefObject<HTMLElement | null>;
}

export function DataModal({
  onOpen,
  isOpen,
  onClose,
  containerRef,
}: DataModalProps) {
  return (
    <>
      <Image
        src="./icons/data-recovery.svg"
        maxW={'18px'}
        cursor={'pointer'}
        filter={'drop-shadow(0px 0px 3px rgba(255, 255, 255, 0.3));'}
        transition={'filter 0.3s'}
        _hover={{
          filter: 'drop-shadow(0px 0px 6px #3b35f3);',
        }}
        onClick={onOpen}
      />
      <Modal
        isCentered
        isOpen={isOpen}
        onClose={onClose}
        closeOnOverlayClick={false}
        scrollBehavior="outside"
        motionPreset="slideInBottom"
        portalProps={containerRef ? { containerRef } : undefined}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Modal Title</ModalHeader>
          <ModalCloseButton />
          <ModalBody>// Your content here</ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3}>
              Save
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
