import { type ListInfoItem } from '@/store/songlist/state'
import { createContext, useContext } from 'react'

export const ListInfoContext = createContext<ListInfoItem>({
  id: '',
  author: '',
  name: '',
  source: 'kw',
})

export const useListInfo = () => {
  return useContext(ListInfoContext)
}
