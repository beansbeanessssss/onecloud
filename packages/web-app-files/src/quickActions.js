import { $gettext } from './gettext'
import { createQuicklink } from './helpers/share'

export async function openNewCollaboratorsPanel(ctx) {
  await ctx.store.dispatch('Files/sidebar/openWithPanel', 'sharing-item')
}

export async function openSpaceMembersPanel(ctx) {
  await ctx.store.dispatch('Files/sidebar/openWithPanel', 'space-share-item')
}

export function canShare(item, store) {
  const { capabilities } = store.state.user
  if (!capabilities.files_sharing || !capabilities.files_sharing.api_enabled) {
    return false
  }
  if (item.isReceivedShare() && !capabilities.files_sharing.resharing) {
    return false
  }
  return item.canShare()
}

export function showQuickLinkPasswordModal(ctx, onConfirm) {
  const modal = {
    variation: 'passive',
    title: $gettext('Add password'),
    cancelText: $gettext('Cancel'),
    confirmText: $gettext('Set'),
    hasInput: true,
    inputLabel: $gettext('Password'),
    onCancel: ctx.store.dispatch('hideModal'),
    onConfirm: (password) => onConfirm(password),
    onInput: (password) => {
      if (password.trim() === '') {
        return ctx.store.dispatch('setModalInputErrorMessage', $gettext('Password cannot be empty'))
      }
      return ctx.store.dispatch('setModalInputErrorMessage', null)
    }
  }

  ctx.store.dispatch('createModal', modal)
  return ctx.store.dispatch('setModalInputErrorMessage', $gettext('Password cannot be empty'))
}

export default {
  collaborators: {
    id: 'collaborators',
    label: ($gettext) => $gettext('Add people'),
    icon: 'user-add',
    handler: openNewCollaboratorsPanel,
    displayed: canShare
  },
  quicklink: {
    id: 'quicklink',
    label: ($gettext) => $gettext('Copy quicklink'),
    icon: 'link',
    handler: async (ctx) => {
      const passwordEnforced =
        ctx.store.getters.capabilities?.files_sharing?.public?.password?.enforced_for?.read_only ===
        true

      if (passwordEnforced) {
        return showQuickLinkPasswordModal(ctx, async (password) => {
          ctx.store.dispatch('hideModal')
          await createQuicklink({ ...ctx, resource: ctx.item, password })
          await ctx.store.dispatch('Files/sidebar/openWithPanel', 'sharing-item')
        })
      }

      await createQuicklink({ ...ctx, resource: ctx.item })
      await ctx.store.dispatch('Files/sidebar/openWithPanel', 'sharing-item')
    },
    displayed: canShare
  }
}
