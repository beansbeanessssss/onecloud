import {
  isDownloadAsArchiveAvailable,
  triggerDownloadAsArchive
} from '../../helpers/download/downloadAsArchive'
import {
  isLocationCommonActive,
  isLocationPublicActive,
  isLocationSpacesActive
} from '../../router'

export default {
  computed: {
    $_downloadArchive_items() {
      return [
        {
          name: 'download-archive',
          icon: 'folder-download',
          handler: this.$_downloadArchive_trigger,
          label: () => {
            return this.$gettext('Download')
          },
          isEnabled: ({ resources }) => {
            if (
              !isLocationSpacesActive(this.$router, 'files-spaces-personal-home') &&
              !isLocationPublicActive(this.$router, 'files-public-files') &&
              !isLocationCommonActive(this.$router, 'files-common-favorites')
            ) {
              return false
            }
            if (resources.length === 0) {
              return false
            }
            if (resources.length === 1 && !resources[0].isFolder) {
              return false
            }
            if (!isDownloadAsArchiveAvailable()) {
              return false
            }
            const downloadDisabled = resources.some((resource) => {
              return !resource.canDownload()
            })
            return !downloadDisabled
          },
          canBeDefault: true,
          componentType: 'oc-button',
          class: 'oc-files-actions-download-archive-trigger'
        }
      ]
    }
  },
  methods: {
    async $_downloadArchive_trigger({ resources }) {
      await triggerDownloadAsArchive({
        fileIds: resources.map((resource) => resource.fileId),
        ...(isLocationPublicActive(this.$router, 'files-public-files') && {
          publicToken: this.$route.params.item.split('/')[0]
        })
      }).catch((e) => {
        console.error(e)
        this.showMessage({
          title: this.$ngettext(
            'Error downloading the selected folder.', // on single selection only available for folders
            'Error downloading the selected files.', // on multi selection available for files+folders
            this.selectedFiles.length
          ),
          status: 'danger'
        })
      })
    }
  }
}
