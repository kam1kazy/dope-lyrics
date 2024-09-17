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
          <MenuOptionGroup title='Отображение' type='checkbox'>
            <MenuItemOption value='hashtags' background={'#0e0f11'}>
              Хэштеги / Выкл / Mini
            </MenuItemOption>
            <MenuItemOption value='reactions' background={'#0e0f11'}>
              Реакции / Выкл / Mini
            </MenuItemOption>
            <MenuItemOption value='divider' background={'#0e0f11'}>
              Разделитель
            </MenuItemOption>
            <MenuItemOption value='fonts' background={'#0e0f11'}>
              Шрифт / Размер
            </MenuItemOption>
            <MenuItemOption value='grammar' background={'#0e0f11'}>
              Исправление грамматики (β)
            </MenuItemOption>
          </MenuOptionGroup>
          <MenuDivider />
          <MenuOptionGroup
            defaultValue='asc'
            title='Фильтры'
            type='radio'
            background={'#0e0f11'}
          >
            <MenuItemOption value='countWords' background={'#0e0f11'}>
              Кол-во слов
            </MenuItemOption>
            <MenuItemOption value='countParagraphs' background={'#0e0f11'}>
              Кол-во абзацев
            </MenuItemOption>
            <MenuItemOption value='hashtag' background={'#0e0f11'}>
              Наименование хэштега
            </MenuItemOption>
            <MenuItemOption value='keywords' background={'#0e0f11'}>
              Ключевые слова
            </MenuItemOption>
          </MenuOptionGroup>
        </MenuList>
      </Menu>
    </>
  )
}
