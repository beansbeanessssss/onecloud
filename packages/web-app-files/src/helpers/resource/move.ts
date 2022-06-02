import { Resource } from './index'
import { join } from 'path'

export enum ResolveStrategy {
  SKIP,
  REPLACE,
  KEEP_BOTH
}
export interface ResolveConflict {
  strategy: ResolveStrategy
  doForAllConflicts: boolean
}
export interface FileConflict {
  resource: Resource
  strategy?: ResolveStrategy
}

export const resolveFileExists = (
  createModal,
  hideModal,
  resource,
  conflictCount,
  $gettext,
  $gettextInterpolate,
  isSingleConflict
) => {
  return new Promise<ResolveConflict>((resolve) => {
    let doForAllConflicts = false
    const modal = {
      variation: 'danger',
      title: $gettext('File already exists'),
      message: $gettextInterpolate(
        $gettext('Resource with name %{name} already exists.'),
        { name: resource.name },
        true
      ),
      cancelText: $gettext('Skip'),
      confirmText: $gettext('Keep both'),
      buttonSecondaryText: $gettext('Replace'),
      checkboxLabel: isSingleConflict
        ? ''
        : $gettextInterpolate(
            $gettext('Do this for all %{count} conflicts'),
            { count: conflictCount },
            true
          ),
      onCheckboxValueChanged: (value) => {
        doForAllConflicts = value
      },
      onCancel: () => {
        hideModal()
        resolve({ strategy: ResolveStrategy.SKIP, doForAllConflicts } as ResolveConflict)
      },
      onConfirmSecondary: () => {
        hideModal()
        const strategy = ResolveStrategy.REPLACE
        resolve({ strategy, doForAllConflicts } as ResolveConflict)
      },
      onConfirm: () => {
        hideModal()
        resolve({ strategy: ResolveStrategy.KEEP_BOTH, doForAllConflicts } as ResolveConflict)
      }
    }
    createModal(modal)
  })
}
export const resolveAllConflicts = async (
  resourcesToMove,
  targetFolder,
  client,
  createModal,
  hideModal,
  $gettext,
  $gettextInterpolate,
  resolveFileExistsMethod
) => {
  // if we implement MERGE, we need to use 'infinity' instead of 1
  const targetFolderItems = await client.files.list(targetFolder.webDavPath, 1)
  const targetPath = targetFolder.path
  const index = targetFolder.webDavPath.lastIndexOf(targetPath)
  const webDavPrefix = targetFolder.webDavPath.substring(0, index)

  // Collect all conflicting resources
  const allConflicts = []
  for (const resource of resourcesToMove) {
    const potentialTargetWebDavPath = join(webDavPrefix, targetFolder.path, resource.path)
    const exists = targetFolderItems.some((e) => e.name === potentialTargetWebDavPath)
    if (exists) {
      allConflicts.push({
        resource,
        strategy: null
      } as FileConflict)
    }
  }
  let count = 0
  let doForAllConflicts = false
  let doForAllConflictsStrategy = null
  const resolvedConflicts = []
  for (const conflict of allConflicts) {
    // Resolve conflicts accordingly
    if (doForAllConflicts) {
      conflict.strategy = doForAllConflictsStrategy
      resolvedConflicts.push(conflict)
      continue
    }

    // Resolve next conflict
    const conflictsLeft = allConflicts.length - count
    const result: ResolveConflict = await resolveFileExistsMethod(
      createModal,
      hideModal,
      conflict.resource,
      conflictsLeft,
      $gettext,
      $gettextInterpolate,
      allConflicts.length === 1
    )
    conflict.strategy = result.strategy
    resolvedConflicts.push(conflict)
    count += 1

    // User checked 'do for all x conflicts'
    if (!result.doForAllConflicts) continue
    doForAllConflicts = true
    doForAllConflictsStrategy = result.strategy
  }
  return resolvedConflicts
}
export const showResultMessage = async (
  errors,
  movedResources,
  showMessage,
  $gettext,
  $gettextInterpolate
) => {
  if (errors.length === 0) {
    const count = movedResources.length
    const title = $gettextInterpolate(
      $gettext('%{count} item was moved successfully'),
      { count },
      true
    )
    showMessage({
      title,
      status: 'success'
    })
    return
  }
  let title = $gettextInterpolate(
    $gettext('Failed to move %{count} resources'),
    { count: errors.length },
    true
  )
  if (errors.length === 1) {
    title = $gettextInterpolate(
      $gettext('Failed to move "%{name}"'),
      { name: errors[0]?.resourceName },
      true
    )
  }
  showMessage({
    title,
    status: 'danger'
  })
}
export const move = async (
  resourcesToMove,
  targetFolder,
  client,
  createModal,
  hideModal,
  showMessage,
  $gettext,
  $gettextInterpolate
) => {
  const errors = []
  const resolvedConflicts = await resolveAllConflicts(
    resourcesToMove,
    targetFolder,
    client,
    createModal,
    hideModal,
    $gettext,
    $gettextInterpolate,
    resolveFileExists
  )
  const movedResources = []

  for (const resource of resourcesToMove) {
    const hasConflict = resolvedConflicts.some((e) => e.resource.id === resource.id)
    let targetName = resource.name
    let overwriteTarget = false
    if (hasConflict) {
      const resolveStrategy = resolvedConflicts.find((e) => e.resource.id === resource.id)?.strategy
      if (resolveStrategy === ResolveStrategy.SKIP) {
        continue
      }
      if (resolveStrategy === ResolveStrategy.REPLACE) {
        overwriteTarget = true
      }
      if (resolveStrategy === ResolveStrategy.KEEP_BOTH) {
        targetName = $gettextInterpolate($gettext('%{name} copy'), { name: resource.name }, true)
      }
    }
    try {
      await client.files.move(
        resource.webDavPath,
        join(targetFolder.webDavPath, targetName),
        overwriteTarget
      )
      movedResources.push(resource)
    } catch (error) {
      console.error(error)
      error.resourceName = resource.name
      errors.push(error)
    }
  }
  showResultMessage(errors, movedResources, showMessage, $gettext, $gettextInterpolate)
  return movedResources
}
