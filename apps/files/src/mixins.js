import filesize from 'filesize'
import moment from 'moment'
import fileTypeIconMappings from './fileTypeIconMappings.json'

export default {
  filters: {
    fileSize (int) {
      if (int < 0) {
        return ''
      }
      if (isNaN(int)) {
        return '?'
      }
      return filesize(int * 100, {
        round: 2
      })
    },
    formDateFromNow (date) {
      return moment(date).fromNow()
    },
    formDate (date) {
      return moment(date).format('MMMM Do YYYY')
    },
    formDateTime (date) {
      return moment(date).format('LLL')
    },
    ucFirst (string) {
      return string.charAt(0).toUpperCase() + string.slice(1)
    }
  },
  data: () => ({
    selectedFile: ''
  }),
  methods: {
    navigateTo (route, param) {
      this.$router.push({
        'name': route,
        'params': {
          'item': param
        }
      })
    },
    reallyDeleteFile (item) {
      this.deleteFiles({
        client: this.$client,
        files: [item]
      })
    },
    changeName (item) {
      if (typeof item === 'object') {
        this.selectedFile = item
        this.newName = item.name
      } else {
        this.renameFile({
          client: this.$client,
          file: this.selectedFile,
          newValue: item
        })
      }
    },
    downloadFile (file) {
      this.$uikit.notification(`Download of ${file.name} will start shortly.`)

      const url = this.$client.files.getFileUrl(file.path)
      let anchor = document.createElement('a')

      let headers = new Headers()
      headers.append('Authorization', 'Bearer ' + this.getToken)

      fetch(url, { headers })
        .then(response => response.blob())
        .then(blobby => {
          let objectUrl = window.URL.createObjectURL(blobby)

          anchor.href = objectUrl
          anchor.download = file.name
          anchor.click()

          window.URL.revokeObjectURL(objectUrl)
        })
    },
    fileTypeIcon (file) {
      if (file) {
        if (file.type === 'folder') {
          return 'ocft icon-folder'
        }
        const icon = fileTypeIconMappings[file.extension]
        if (icon) return `ocft icon-${icon}`
      }
      return 'ocft icon-x-office-document'
    },
    label (string) {
      let cssClass = ['uk-label']

      switch (parseInt(string)) {
        case 1:
          cssClass.push('uk-label-danger')
          break
        case 2:
          cssClass.push('uk-label-warning')
          break
        default:
          cssClass.push('uk-label-success')
      }

      return '<span class="' + cssClass.join(' ') + '">' + string + '</span>'
    }
  }
}
