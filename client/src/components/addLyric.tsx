'use client'

import { useState } from 'react'
import { Button, Input, FormControl } from '@chakra-ui/react'
import { useMutation } from '@apollo/client'
import { ADD_LYRIC, ALL_LYRICS } from '@/server/lyrics'

export const AddLyric = () => {
  const [lyric, setLyric] = useState('')

  // Кол-во слов
  const countWords = (lyric: string) => {
    const words = lyric.trim().split(/\s+/)
    return Number(words.filter((word) => word.length > 0).length)
  }

  // Кол-во абзацев
  const countParagraphs = (lyric: string) => {
    const paragraphs = lyric.split(/[\r\n]+/)
    return Number(paragraphs.filter((lyric: string) => lyric.trim().length > 0).length)
  }

  // Функция добавления фрагмента через Mutation
  const [createLyric, { error }] = useMutation(ADD_LYRIC, {
    update(cache, { data: { createLyric } }) {
      const cachedData = cache.readQuery({ query: ALL_LYRICS })
      const { lyrics }: any = cachedData

      cache.writeQuery({
        query: ALL_LYRICS,
        data: {
          lyrics: [createLyric, ...(lyrics ?? [])],
        },
      })
    },
  })

  // Добавление фрагмента
  const handleAddLyric = () => {
    if (lyric.trim().length > 0) {
      createLyric({
        variables: {
          text: lyric,
          is_reaction: false,
          paragraph_count: countParagraphs(lyric),
          word_count: countWords(lyric),
          hashtag_count: 0,
          hashtags: [],
        },
      })
      setLyric('')
    }
  }

  // По нажатию Enter запускаем функцию handleAddLyric
  const handleChange = (e: any) => {
    if (e.key === 'Enter') {
      handleAddLyric()
    }
  }

  if (error) {
    return <h2>Error...</h2>
  }

  return (
    <>
      <FormControl display={'flex'} mt={6}>
        <Input value={lyric} onChange={(e) => setLyric(e.target.value)} onKeyDown={(e) => handleChange(e)} placeholder='Фразочка' />
        <Button onClick={handleAddLyric}>Добавить</Button>
      </FormControl>
    </>
  )
}
