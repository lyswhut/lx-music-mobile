type MakeOptional<Type, Key extends keyof Type> = Omit<Type, Key> & Partial<Pick<Type, Key>>

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
}

type Modify<T, R> = Omit<T, keyof R> & R

type MakeArrayItemReadOnly<T extends any[]> = { [K in keyof T]: Readonly<T[K]> }

type ForwardRefFn<R> = <P = {}>(p: React.PropsWithChildren<P> & React.RefAttributes<R>) => React.ReactNode | null

// type UndefinedOrNever = undefined
type Actions<T extends { action: string, data?: any }> = {
  [U in T as U['action']]: 'data' extends keyof U ? U['data'] : undefined
}
