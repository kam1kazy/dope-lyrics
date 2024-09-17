import {
  Menu,
  MenuButton,
  MenuList,
  MenuOptionGroup,
  MenuItemOption,
  MenuDivider,
  IconButton,
  Image,
} from '@chakra-ui/react'

export default function SettingList({ onOpen, isOpen, onClose }: any) {
  return (
    <>
      <Menu closeOnSelect={false} isLazy>
        <MenuButton
          as={IconButton}
          aria-label='Options'
          variant='outline'
          background={'transparent'}
          border={'none'}
          maxW={'24px'}
          minW={'24px'}
          _hover={{
            background: 'transparent',
            filter: 'drop-shadow(0px 0px 3px #3b35f3);',
          }}
          _active={{
            background: 'transparent',
          }}
        >
          <Image
            src='./icons/settings.svg'
            maxW={'24px'}
            cursor={'pointer'}
            filter={'drop-shadow(0px 0px 3px rgba(255, 255, 255, 0.3));'}
            transition={'filter 0.3s'}
            m={'auto'}
            _hover={{
              filter: 'drop-shadow(0px 0px 3px #3b35f3);',
            }}
          />
        </MenuButton>
        <MenuList
          minWidth='340px'
          top={'auto'}
          background={'#0e0f11'}
          borderBottomRightRadius={0}
          borderBottomLeftRadius={0}
        >
          <MenuOptionGroup
            defaultValue='asc'
            title='Order'
            type='radio'
            background={'#0e0f11'}
          >
            <MenuItemOption value='asc' background={'#0e0f11'}>
              Ascending
            </MenuItemOption>
            <MenuItemOption value='desc' background={'#0e0f11'}>
              Descending
            </MenuItemOption>
          </MenuOptionGroup>
          <MenuDivider />
          <MenuOptionGroup title='Country' type='checkbox'>
            <MenuItemOption value='email' background={'#0e0f11'}>
              Email
            </MenuItemOption>
            <MenuItemOption value='phone' background={'#0e0f11'}>
              Phone
            </MenuItemOption>
            <MenuItemOption value='country' background={'#0e0f11'}>
              Country
            </MenuItemOption>
          </MenuOptionGroup>
        </MenuList>
      </Menu>
    </>
  )
}
