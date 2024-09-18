// STYLES
import {
  Collapse,
  Box,
  Text,
  Heading,
  Divider,
  SimpleGrid,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react'

// COMPONENT
import { RadioSelect } from '../controls/radioSelect'

export default function SettingList({ isOpen }: { isOpen: boolean }) {
  return (
    <Collapse
      in={isOpen}
      style={{ position: 'absolute', bottom: '61px', width: '98%' }}
    >
      <Box
        p='25px'
        color='white'
        mt='4'
        bg='rgba(34, 60, 80, 1)'
        rounded='md'
        shadow='md'
        fontSize='14px'
        boxShadow={'0px 10px 26px 20px rgba(34, 60, 80, 0.35)'}
      >
        <Heading fontSize={'18px'} mb={'10px'}>
          Отображение
        </Heading>
        <Divider />

        <Box
          display={'flex'}
          flexWrap={'wrap'}
          justifyContent={'space-between'}
        >
          {/* Row */}
          <Text alignContent={'center'}>Разделитель:</Text>
          <RadioSelect settings={['Выкл', '***', '...', '----']} />

          {/* Row */}
          <Text alignContent={'center'}>Исправление грамматики (β):</Text>
          <RadioSelect settings={['Вкл', 'Выкл']} />
        </Box>

        <Box as={SimpleGrid} columns={{ base: 4 }} columnGap={'10px'}>
          {/* Row */}
          <Text alignContent={'center'}>Хэштеги:</Text>
          <RadioSelect settings={['Вкл', 'Выкл', 'Mini']} />

          {/* Row */}
          <Text alignContent={'center'}>Шрифт:</Text>
          <RadioSelect settings={['Font', 'Font2', 'Font3']} />

          {/* Row */}
          <Text alignContent={'center'}>Хэштеги:</Text>
          <RadioSelect settings={['Вкл', 'Выкл', 'Mini']} />

          {/* Row */}
          <Text alignContent={'center'}>Шрифт:</Text>
          <RadioSelect settings={['Font', 'Font2', 'Font3']} />

          {/* Row */}
          <Text alignContent={'center'}>Реакции:</Text>
          <RadioSelect settings={['Вкл', 'Выкл', 'Mini']} />

          {/* Row */}
          <Text alignContent={'center'}>Размер:</Text>
          <RadioSelect settings={['14', '16', '18']} />
        </Box>

        <Heading fontSize={'18px'} mb={'10px'} mt={'20px'}>
          Фильтры
        </Heading>

        <Divider mb={'10px'} />

        <Box
          display={'flex'}
          flexWrap={'wrap'}
          justifyContent={'space-between'}
          rowGap={'10px'}
        >
          {/* Row */}
          <Text alignContent={'center'}>Кол-во слов</Text>
          <NumberInput width={'90px'} defaultValue={0} min={0}>
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>

          {/* Row */}
          <Text alignContent={'center'}>Кол-во абзацев</Text>
          <NumberInput width={'90px'} defaultValue={0} min={0}>
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>

          {/* Row */}
          <Text alignContent={'center'}>Наименование хэштега</Text>
          <Input width={'90px'} placeholder='Tags' />

          {/* Row */}
          <Text alignContent={'center'}>Ключевые слова</Text>
          <Input width={'90px'} placeholder='Words' />
        </Box>
      </Box>
    </Collapse>
  )
}
