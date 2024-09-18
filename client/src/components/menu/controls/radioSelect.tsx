import { useState, useEffect } from 'react'

// STYLES
import {
  Button,
  Badge,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverCloseButton,
  PopoverBody,
  RadioGroup,
  Radio,
  Stack,
  FormControl,
  useDisclosure,
} from '@chakra-ui/react'

export const RadioSelect = ({ settings }: { settings: string[] }) => {
  const [selectedOption, setOptions] = useState(settings[0])
  const { isOpen, onToggle, onClose } = useDisclosure()

  useEffect(() => {
    setOptions(settings[0])
  }, [settings])

  const handlerChangeStatus = (value: string) => {
    setOptions(value)
    onClose()
  }

  return (
    <Popover closeOnBlur={false}>
      <PopoverTrigger>
        <Button
          flex={'1 1'}
          minW={'35px'}
          maxW={'max-content'}
          variant='ghost'
          color={'white'}
          fontSize={'14px'}
          p={2}
          _hover={{ color: '#000', background: '#fff' }}
        >
          {selectedOption}
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <FormControl>
          <PopoverCloseButton zIndex={5} />
          <PopoverBody>
            <RadioGroup
              value={selectedOption}
              onChange={(value) => {
                handlerChangeStatus(value)
              }}
            >
              <Stack gap={[1, 3]} direction={['row', 'column']}>
                {settings.map((option) => (
                  <Radio value={option} key={option}>
                    <Badge variant='outline'>{option}</Badge>
                  </Radio>
                ))}
              </Stack>
            </RadioGroup>
          </PopoverBody>
        </FormControl>
      </PopoverContent>
    </Popover>
  )
}
