import { mapActions, mapGetters } from 'vuex'
import MixinDeleteResources from './mixins/deleteResources'

export default {
  mixins: [MixinDeleteResources],

  computed: {
    ...mapGetters('Files', [
      'actionsInProgress',
      'activeFiles',
      'selectedFiles',
      'highlightedFile',
      'flatFileList'
    ]),
    ...mapGetters(['capabilities', 'fileSideBars']),
    // Files lists
    actions() {
      const actions = [
        {
          icon: 'edit',
          ariaLabel: this.$gettext('Rename'),
          handler: this.$_fileActions_displayRenameDialog,
          isEnabled: function(item, parent) {
            if (parent && !parent.canRename()) {
              return false
            }
            return item.canRename()
          }
        },
        {
          icon: 'file_download',
          handler: this.downloadFile,
          ariaLabel: this.$gettext('Download'),
          isEnabled: function(item) {
            return item.canDownload()
          }
        },
        {
          icon: 'delete',
          ariaLabel: this.$gettext('Delete'),
          handler: this.$_fileActions_deleteResource,
          isEnabled: function(item, parent) {
            if (parent && !parent.canBeDeleted()) {
              return false
            }
            return item.canBeDeleted()
          }
        }
      ]
      // FIXME: we are assuming this.fileSideBars and others are available on object
      for (const sideBar of this.fileSideBars) {
        if (sideBar.enabled !== undefined && !sideBar.enabled(this.capabilities)) {
          continue
        }
        if (sideBar.quickAccess) {
          actions.push({
            icon: sideBar.quickAccess.icon,
            ariaLabel: sideBar.quickAccess.ariaLabel,
            handler: this.openSideBar,
            handlerData: sideBar.app,
            isEnabled: function(item) {
              return true
            }
          })
        }
      }

      return actions
    }
  },
  methods: {
    ...mapActions('Files', ['renameFile']),
    ...mapActions(['showMessage', 'createModal', 'hideModal', 'setModalInputErrorMessage']),

    actionInProgress(item) {
      return this.actionsInProgress.some(itemInProgress => itemInProgress.id === item.id)
    },

    disabledActionTooltip(item) {
      if (this.actionInProgress(item)) {
        if (item.type === 'folder') {
          return this.$gettext('There is currently an action in progress for this folder')
        }

        return this.$gettext('There is currently an action in progress for this file')
      }

      return null
    },

    $_fileActions_deleteResource(resource) {
      this.$_deleteResources_displayDialog(resource, true)
    },

    // Files lists
    openFileActionBar(file) {
      this.$emit('FileAction', file)
    },
    openSideBar(file, sideBarName) {
      this.$emit('sideBarOpen', file, sideBarName)
    },
    navigateTo(param) {
      if (this.searchTerm !== '' && this.$route.params.item === param) {
        this.resetSearch()
      }
      let route = 'files-list'
      if (this.publicPage()) {
        route = 'public-files'
      }
      this.$router.push({
        name: route,
        params: {
          item: param
        }
      })
    },
    openFileAction(action, filePath) {
      if (action.version === 3) {
        // TODO: replace more placeholder in the final version
        const finalUrl = action.url
          .replace('{PATH}', encodeURIComponent(filePath.path))
          .replace('{FILEID}', encodeURIComponent(filePath.id))
        const win = window.open(finalUrl, '_blank')
        // in case popup is blocked win will be null
        if (win) {
          win.focus()
        }
        return
      }
      if (action.newTab) {
        const path = this.$router.resolve({
          name: action.routeName,
          params: { filePath: filePath }
        }).href
        const url = window.location.origin + '/' + path
        const target = `${action.routeName}-${filePath}`
        const win = window.open(url, target)
        // in case popup is blocked win will be null
        if (win) {
          win.focus()
        }
        return
      }

      const routeName = action.routeName ? action.app + '/' + action.routeName : action.app
      const params = {
        filePath,
        contextRouteName: this.$route.name
      }

      this.$router.push({
        name: routeName,
        params
      })
    },

    $_fileActions_renameResource(resource, newName) {
      this.toggleModalConfirmButton()

      this.renameFile({
        client: this.$client,
        file: resource,
        newValue: newName,
        publicPage: this.publicPage()
      })
        .then(() => {
          this.hideModal()
        })
        .catch(error => {
          this.toggleModalConfirmButton()
          let translated = this.$gettext('Error while renaming "%{file}" to "%{newName}"')
          if (error.statusCode === 423) {
            translated = this.$gettext(
              'Error while renaming "%{file}" to "%{newName}" - the file is locked'
            )
          }
          const title = this.$gettextInterpolate(
            translated,
            { file: resource.name, newName: newName },
            true
          )
          this.showMessage({
            title: title,
            status: 'danger'
          })
        })
    },

    $_fileActions_renameDialog_checkNewName(currentName, newName) {
      if (!newName) {
        return this.setModalInputErrorMessage(this.$gettext('The name cannot be empty'))
      }

      if (/[/]/.test(newName)) {
        return this.setModalInputErrorMessage(this.$gettext('The name cannot contain "/"'))
      }

      if (newName === '.') {
        return this.setModalInputErrorMessage(this.$gettext('The name cannot be equal to "."'))
      }

      if (newName === '..') {
        return this.setModalInputErrorMessage(this.$gettext('The name cannot be equal to ".."'))
      }

      if (/\s+$/.test(newName)) {
        return this.setModalInputErrorMessage(this.$gettext('The name cannot end with whitespace'))
      }

      if (!this.flatFileList) {
        const exists = this.activeFiles.find(n => {
          if (n.name === newName && currentName !== newName) {
            return n
          }
        })

        if (exists) {
          const translated = this.$gettext('The name "%{name}" is already taken')

          this.setModalInputErrorMessage(
            this.$gettextInterpolate(translated, { name: newName }, true)
          )
        }
      }

      this.setModalInputErrorMessage(null)
    },

    $_fileActions_displayRenameDialog(resource) {
      const isFolder = resource.type === 'folder'
      const confirmAction = newName => {
        this.$_fileActions_renameResource(resource, newName)
      }
      const checkName = newName => {
        this.$_fileActions_renameDialog_checkNewName(resource.name, newName)
      }

      const modal = {
        variation: 'info',
        title: isFolder
          ? this.$gettext('Rename folder ') + resource.name
          : this.$gettext('Rename file ' + resource.name),
        cancelText: this.$gettext('Cancel'),
        confirmText: this.$gettext('Rename'),
        hasInput: true,
        inputValue: resource.name,
        inputPlaceholder: isFolder
          ? this.$gettext('Enter new folder name…')
          : this.$gettext('Enter new file name…'),
        inputLabel: isFolder ? this.$gettext('Folder name') : this.$gettext('File name'),
        onCancel: this.hideModal,
        onConfirm: confirmAction,
        onType: checkName
      }

      this.createModal(modal)
    }
  }
}
