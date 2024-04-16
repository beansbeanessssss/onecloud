import { useEventListener } from '@vueuse/core'
import { Ref, ref, unref } from 'vue'
import * as uuid from 'uuid'

interface KeyboardActionsOptions {
  skipDisabledKeyBindingsCheck?: boolean
}

export enum Key {
  C = 'c',
  V = 'v',
  X = 'x',
  A = 'a',
  S = 's',
  Space = ' ',
  ArrowUp = 'ArrowUp',
  ArrowDown = 'ArrowDown',
  ArrowLeft = 'ArrowLeft',
  ArrowRight = 'ArrowRight',
  Esc = 'Escape'
}

export enum Modifier {
  Ctrl = 'Control',
  Shift = 'Shift'
}

export interface KeyboardActions {
  actions: Ref<Array<KeyboardAction>>
  selectionCursor: Ref<number>
  removeKeyAction: (id: string) => void
  resetSelectionCursor: () => void
  bindKeyAction: (keys: { primary: Key; modifier?: Modifier }, callback: () => void) => string
}

export interface KeyboardAction {
  id: string
  primary: Key
  modifier: Modifier | null
  callback: (event: KeyboardEvent) => void
}

const areCustomKeyBindingsDisabled = () => {
  const activeElementTag = document.activeElement.tagName
  const type = document.activeElement.getAttribute('type')
  if (
    ['textarea', 'input', 'select'].includes(activeElementTag.toLowerCase()) &&
    type !== 'checkbox'
  ) {
    return true
  }
  const closestSelectionEl = window.getSelection().focusNode as HTMLElement
  if (!closestSelectionEl) {
    return false
  }
  let customKeyBindings
  try {
    customKeyBindings = closestSelectionEl?.closest("[data-custom-key-bindings-disabled='true']")
  } catch {
    customKeyBindings = closestSelectionEl?.parentElement.closest(
      "[data-custom-key-bindings-disabled='true']"
    )
  }
  if (customKeyBindings) {
    return true
  }

  const isTextSelected = window.getSelection().type === 'Range'
  return isTextSelected
}

export const useKeyboardActions = (options?: KeyboardActionsOptions): KeyboardActions => {
  const actions = ref<Array<KeyboardAction>>([])
  const selectionCursor = ref(0)

  const listener = (event: KeyboardEvent): void => {
    if (!options?.skipDisabledKeyBindingsCheck && areCustomKeyBindingsDisabled()) {
      return
    }

    type ModifierKey = 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey'

    const { key, ctrlKey, metaKey, shiftKey } = event
    let modifier = null
    const disallowedModifierKeys: ModifierKey[] = []

    if (metaKey || ctrlKey) {
      modifier = Modifier.Ctrl
      disallowedModifierKeys.push('altKey', 'shiftKey')
    } else if (shiftKey) {
      modifier = Modifier.Shift
      disallowedModifierKeys.push('altKey', 'ctrlKey', 'metaKey')
    }

    const hasDisallowedModifier = (event: KeyboardEvent, disallowedModifierKeys: ModifierKey[]) =>
      disallowedModifierKeys.some((key) => event[key])

    unref(actions)
      .filter((action) => {
        return (
          action.primary === key &&
          action.modifier === modifier &&
          !hasDisallowedModifier(event, disallowedModifierKeys)
        )
      })
      .forEach((action) => {
        event.preventDefault()
        action.callback(event)
      })
  }
  const bindKeyAction = (
    keys: { primary: Key; modifier?: Modifier },
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

  useEventListener(document, 'keydown', listener)

  return {
    actions,
    bindKeyAction,
    removeKeyAction,
    selectionCursor,
    resetSelectionCursor
  }
}
