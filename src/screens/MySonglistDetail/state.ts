import { createContext, useContext } from 'react'

export const SonglistInfoContext = createContext<LX.List.UserListInfo>({
  id: '', name: '', locationUpdateTime: null,
})

export const useSonglistInfo = () => useContext(SonglistInfoContext)
