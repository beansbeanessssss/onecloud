import { mapActions } from 'vuex'

export default {
  computed: {
    $_uploadLogo_items() {
      return [
        {
          name: 'upload-logo',
          icon: 'image-add',
          label: () => {
            return `${this.$gettext('Upload logo')} (${this.supportedLogoMimeTypesDisplayValue})`
          },
          handler: this.$_uploadLogo_trigger,
          componentType: 'button',
          class: 'oc-general-actions-upload-logo-trigger'
        }
      ]
    }
  },
  methods: {
    ...mapActions(['showMessage']),

    $_uploadLogo_trigger() {
      this.$refs.logoInput.click()
    },
    $_uploadLogo_upload(ev) {
      const file = ev.currentTarget.files[0]

      if (!file) {
        return
      }

      if (!this.supportedLogoMimeTypes.includes(file.type)) {
        return this.showMessage({
          title: this.$gettext('The file type is unsupported'),
          status: 'danger'
        })
      }

      this.showMessage({
        title: this.$gettext('Logo was uploaded successfully')
      })

      return
      setTimeout(() => {
        this.$router.go(this.$router.currentRoute)
      }, 1000)
    }
  }
}
