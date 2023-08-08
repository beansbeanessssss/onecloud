import { onBeforeUnmount, onMounted, Ref, ref, unref } from 'vue'
import * as uuid from 'uuid'

export enum Key {
  C = 'c',
  V = 'v',
  X = 'x',
  A = 'a',
  S = 's',
  Space = ' ',
  ArrowUp = 'ArrowUp',
  ArrowDown = 'ArrowDown',
  Esc = 'Escape'
}

export enum ModifierKey {
  Ctrl = 'Control',
  Shift = 'Shift'
}

export interface KeyboardActions {
  actions: Ref<Array<KeyboardAction>>
  selectionCursor: Ref<number>
  removeKeyAction: (id: string) => void
  resetSelectionCursor: () => void
  bindKeyAction: (keys: { primary: Key; modifier?: ModifierKey }, callback: () => void) => string
}

export interface KeyboardAction {
  id: string
  primary: Key
  modifier: ModifierKey | null
  callback: (event: KeyboardEvent) => void
}

export const useKeyboardActions = (keyBindOnElementId: string | null = null): KeyboardActions => {
  const actions = ref<Array<KeyboardAction>>([])
  const selectionCursor = ref(0)
  const listener = (event: KeyboardEvent): void => {
    const { key, ctrlKey, metaKey, shiftKey } = event
    let modifier = null
    if (metaKey || ctrlKey) {
      modifier = ModifierKey.Ctrl
    } else if (shiftKey) {
      modifier = ModifierKey.Shift
    }
    unref(actions)
      .filter((action) => {
        return action.primary === key && action.modifier === modifier
      })
      .forEach((action) => {
        event.preventDefault()
        action.callback(event)
      })
  }
  const bindKeyAction = (
    keys: { primary: Key; modifier?: ModifierKey },
    callback: () => void
  ): string => {
    const id = uuid.v4()
    actions.value.push({
      id,
      ...keys,
      modifier: keys.modifier ?? null,
      callback
    })
    return id
  }

  const removeKeyAction = (id: string): void => {
    actions.value = actions.value.filter((action) => action.id !== id)
  }

  const resetSelectionCursor = (): void => {
    selectionCursor.value = 0
  }

  onMounted(() => {
    let element = null
    if (keyBindOnElementId) {
      element = document.getElementById(keyBindOnElementId)
    }
    element
      ? element.addEventListener('keydown', listener)
      : document.addEventListener('keydown', listener)
  })

  onBeforeUnmount(() => {
    let element = null
    if (keyBindOnElementId) {
      element = document.getElementById(keyBindOnElementId)
    }
    element
      ? element.removeEventListener('keydown', listener)
      : document.removeEventListener('keydown', listener)
  })

  return {
    actions,
    bindKeyAction,
    removeKeyAction,
    selectionCursor,
    resetSelectionCursor
  }
}
