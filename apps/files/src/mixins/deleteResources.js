import { mapGetters, mapActions } from 'vuex'
const { default: PQueue } = require('p-queue')

export default {
  data: () => ({
    deleteResources_queue: new PQueue({ concurrency: 4 }),
    deleteResources_deleteOps: []
  }),

  computed: {
    ...mapGetters('Files', ['selectedFiles']),

    $_deleteResources_isInTrashbin() {
      return this.$route.name === 'files-trashbin'
    },

    $_deleteResources_resources() {
      return JSON.parse(JSON.stringify(this.selectedFiles))
    },

    $_deleteResources_dialogTitle() {
      const resources = this.$_deleteResources_resources
      const isFolder = resources[0].type === 'folder'
      let title = null

      if (resources.length === 1) {
        title = this.$_deleteResources_isInTrashbin
          ? this.$gettext('Permanently delete %{type} %{name}')
          : this.$gettext('Delete %{type} %{name}')

        return this.$gettextInterpolate(
          title,
          {
            type: isFolder ? this.$gettext('folder') : this.$gettext('file'),
            name: resources[0].name
          },
          true
        )
      }

      title = this.$_deleteResources_isInTrashbin
        ? this.$gettext('Permanently delete %{amount} selected resources?')
        : this.$gettext('Delete %{amount} selected resources')

      return this.$gettextInterpolate(title, { amount: resources.length }, false)
    },

    $_deleteResources_dialogMessage() {
      const resources = this.$_deleteResources_resources
      const isFolder = resources[0].type === 'folder'
      let message = null

      if (resources.length === 1) {
        message = this.$_deleteResources_isInTrashbin
          ? this.$gettext(
              'Are you sure you want to delete this %{type}? All it’s content will be permanently removed. This action cannot be undone.'
            )
          : this.$gettext('Are you sure you want to delete this %{type}?')

        return this.$gettextInterpolate(
          message,
          { type: isFolder ? this.$gettext('folder') : this.$gettext('file') },
          true
        )
      }

      return this.$_deleteResources_isInTrashbin
        ? this.$gettext(
            'Are you sure you want to delete all selected resources? All their content will be permanently removed. This action cannot be undone.'
          )
        : this.$gettext('Are you sure you want to delete all selected resources')
    }
  },

  methods: {
    ...mapActions('Files', [
      'pushResourcesToDeleteList',
      'removeFilesFromTrashbin',
      'setHighlightedFile',
      'resetFileSelection',
      'addFileSelection',
      'deleteFiles'
    ]),
    ...mapActions(['showMessage', 'toggleModalConfirmButton', 'hideModal', 'createModal']),

    $_deleteResources_hideDialog() {
      this.resetFileSelection()
      this.setHighlightedFile(null)
      this.hideModal()
    },

    $_deleteResources_trashbin_deleteOp(resource) {
      return this.$client.fileTrash
        .clearTrashBin(resource.id)
        .then(() => {
          this.removeFilesFromTrashbin([resource])
          const translated = this.$gettext('%{file} was successfully deleted')
          this.showMessage({
            title: this.$gettextInterpolate(translated, { file: resource.name }, true)
          })
        })
        .catch(error => {
          if (error.statusCode === 423) {
            // TODO: we need a may retry option ....
            const p = this.deleteResources_queue.add(() => {
              return this.$_deleteResources_trashbin_deleteOp(resource)
            })
            this.deleteResources_deleteOps.push(p)
            return
          }

          const translated = this.$gettext('Deletion of %{file} failed')
          this.showMessage({
            title: this.$gettextInterpolate(translated, { file: resource.name }, true),
            desc: error.message,
            status: 'danger'
          })
        })
    },

    $_deleteResources_trashbin_delete() {
      // TODO: use clear all if all files are selected
      this.toggleModalConfirmButton()
      for (const file of this.$_deleteResources_resources) {
        const p = this.deleteResources_queue.add(() => {
          return this.$_deleteResources_trashbin_deleteOp(file)
        })
        this.deleteResources_deleteOps.push(p)
      }

      Promise.all(this.deleteResources_deleteOps).then(() => {
        this.$_deleteResources_hideDialog()
        this.toggleModalConfirmButton()
      })
    },

    $_deleteResources_filesList_delete() {
      this.deleteFiles({
        client: this.$client,
        files: this.$_deleteResources_resources,
        publicPage: this.publicPage(),
        $gettext: this.$gettext,
        $gettextInterpolate: this.$gettextInterpolate
      }).then(() => {
        this.$_deleteResources_hideDialog()
        this.toggleModalConfirmButton()
      })
    },

    $_deleteResources_delete() {
      this.toggleModalConfirmButton()

      this.$_deleteResources_isInTrashbin
        ? this.$_deleteResources_trashbin_delete()
        : this.$_deleteResources_filesList_delete()
    },

    $_deleteResources_displayDialog(resources = null, direct = false) {
      // Deleting a resource via direct action
      // TODO: Do a direct delete without actually selecting the resource and resetting the selection
      if (direct) {
        this.resetFileSelection()
        this.addFileSelection(resources)
      }

      const modal = {
        variation: 'danger',
        icon: 'warning',
        title: this.$_deleteResources_dialogTitle,
        message: this.$_deleteResources_dialogMessage,
        cancelText: this.$gettext('Cancel'),
        confirmText: this.$gettext('Delete'),
        onCancel: this.$_deleteResources_hideDialog,
        onConfirm: this.$_deleteResources_delete
      }

      this.createModal(modal)
    }
  }
}
