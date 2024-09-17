import { useState } from 'react'

import {
  Menu,
  MenuButton,
  MenuList,
  MenuOptionGroup,
  MenuItemOption,
  MenuDivider,
  IconButton,
  Image,
  useDisclosure,
} from '@chakra-ui/react'

function TransitionExample() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [scrollBehavior, setScrollBehavior] = useState('inside')

  return (
    <>
      <Menu closeOnSelect={false} isLazy>
        <MenuButton as={IconButton} aria-label='Options' variant='outline'>
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
        </MenuButton>
        <MenuList minWidth='240px'>
          <MenuOptionGroup defaultValue='asc' title='Order' type='radio'>
            <MenuItemOption value='asc'>Ascending</MenuItemOption>
            <MenuItemOption value='desc'>Descending</MenuItemOption>
          </MenuOptionGroup>
          <MenuDivider />
          <MenuOptionGroup title='Country' type='checkbox'>
            <MenuItemOption value='email'>Email</MenuItemOption>
            <MenuItemOption value='phone'>Phone</MenuItemOption>
            <MenuItemOption value='country'>Country</MenuItemOption>
          </MenuOptionGroup>
        </MenuList>
      </Menu>
    </>
  )
}
