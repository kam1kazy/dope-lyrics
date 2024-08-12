import { ALL_LYRICS } from '@/server/lyrics'
import { useQuery } from '@apollo/client'
import { Flex } from '@chakra-ui/react'

export interface TotalCountProps {
  count: number
}

export const TotalCount = ({ count }: TotalCountProps) => {
  return (
    <Flex justifyContent={'center'} borderTop={'2px'} mt={5}>
      {count && <b>Total lyrics: {count}</b>}
    </Flex>
  )
}
