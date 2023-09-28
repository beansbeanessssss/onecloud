import { Ref, MaybeRef } from 'vue'

export type ReadOnlyRef<T> = Readonly<Ref<T>>
export type MaybeReadonlyRef<T> = MaybeRef<T> | ReadOnlyRef<T>

// FIXME: get rid of imports using this re-export
export type { MaybeRef } from 'vue'
