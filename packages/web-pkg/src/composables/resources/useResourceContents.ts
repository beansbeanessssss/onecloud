import { computed, unref } from 'vue'
import { storeToRefs } from 'pinia'
import { useGettext } from 'vue3-gettext'
import { useResourcesStore } from '../piniaStores'
import { useRouter } from '../router'
import { isLocationSharesActive } from '../../router'
import { formatFileSize } from '../../helpers'

export const useResourceContents = () => {
  const resourcesStore = useResourcesStore()
  const { current: currentLanguage, $ngettext } = useGettext()
  const router = useRouter()

  const { totalResourcesCount, totalResourcesSize, areHiddenFilesShown } =
    storeToRefs(resourcesStore)

  const resourceContentsText = computed(() => {
    let filesStr = $ngettext(
      '%{ filesCount } file',
      '%{ filesCount } files',
      unref(totalResourcesCount).files,
      {
        filesCount: unref(totalResourcesCount).files.toString()
      }
    )

    if (!unref(areHiddenFilesShown) && unref(totalResourcesCount).hiddenFiles) {
      filesStr = $ngettext(
        '%{ filesCount } file including %{ filesHiddenCount } hidden',
        '%{ filesCount } files including %{ filesHiddenCount } hidden',
        unref(totalResourcesCount).files,
        {
          filesCount: unref(totalResourcesCount).files.toString(),
          filesHiddenCount: unref(totalResourcesCount).hiddenFiles.toString()
        }
      )
    }

    let foldersStr = $ngettext(
      '%{ foldersCount } folder',
      '%{ foldersCount } folders',
      unref(totalResourcesCount).folders,
      {
        foldersCount: unref(totalResourcesCount).folders.toString()
      }
    )

    if (!unref(areHiddenFilesShown) && unref(totalResourcesCount).hiddenFolders) {
      foldersStr = $ngettext(
        '%{ foldersCount } folder including %{ foldersHiddenCount } hidden',
        '%{ foldersCount } folders including %{ foldersHiddenCount } hidden',
        unref(totalResourcesCount).folders,
        {
          foldersCount: unref(totalResourcesCount).folders.toString(),
          foldersHiddenCount: unref(totalResourcesCount).hiddenFolders.toString()
        }
      )
    }

    const spacesStr = $ngettext(
      '%{ spacesCount } space',
      '%{ spacesCount } spaces',
      unref(totalResourcesCount).spaces,
      {
        spacesCount: unref(totalResourcesCount).spaces.toString()
      }
    )

    const totalItemsCount =
      unref(totalResourcesCount).files +
      unref(totalResourcesCount).folders +
      unref(totalResourcesCount).spaces
    const itemSize = formatFileSize(unref(totalResourcesSize), currentLanguage)
    const size = parseFloat(unref(totalResourcesSize)?.toString())
    const showSpaces = isLocationSharesActive(router, 'files-shares-via-link')

    if (showSpaces) {
      return size > 0
        ? $ngettext(
            '%{ itemsCount } item with %{ itemSize } in total (%{ filesStr}, %{foldersStr}, %{spacesStr})',
            '%{ itemsCount } items with %{ itemSize } in total (%{ filesStr}, %{foldersStr}, %{spacesStr})',
            totalItemsCount,
            {
              itemsCount: totalItemsCount.toString(),
              itemSize,
              filesStr,
              foldersStr,
              spacesStr
            }
          )
        : $ngettext(
            '%{ itemsCount } item in total (%{ filesStr}, %{foldersStr}, %{spacesStr})',
            '%{ itemsCount } items in total (%{ filesStr}, %{foldersStr}, %{spacesStr})',
            totalItemsCount,
            {
              itemsCount: totalItemsCount.toString(),
              itemSize,
              filesStr,
              foldersStr,
              spacesStr
            }
          )
    } else {
      return size > 0
        ? $ngettext(
            '%{ itemsCount } item with %{ itemSize } in total (%{ filesStr}, %{foldersStr})',
            '%{ itemsCount } items with %{ itemSize } in total (%{ filesStr}, %{foldersStr})',
            totalItemsCount,
            {
              itemsCount: totalItemsCount.toString(),
              itemSize,
              filesStr,
              foldersStr,
              spacesStr
            }
          )
        : $ngettext(
            '%{ itemsCount } item in total (%{ filesStr}, %{foldersStr})',
            '%{ itemsCount } items in total (%{ filesStr}, %{foldersStr})',
            totalItemsCount,
            {
              itemsCount: totalItemsCount.toString(),
              itemSize,
              filesStr,
              foldersStr,
              spacesStr
            }
          )
    }
  })

  return {
    resourceContentsText
  }
}
