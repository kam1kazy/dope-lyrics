import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Image,
} from '@chakra-ui/react'

export default function SettingData({ onOpen, isOpen, onClose }: any) {
  return (
    <>
      <Image
        src='./icons/data-recovery.svg'
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
        scrollBehavior='outside'
        motionPreset='slideInBottom'
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Modal Title</ModalHeader>
          <ModalCloseButton />
          <ModalBody>// Your content here</ModalBody>
          <ModalFooter>
            <Button colorScheme='blue' mr={3}>
              Save
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
