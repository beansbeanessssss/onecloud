import { mapActions } from 'vuex'

export default {
  computed: {
    $_delete_items() {
      return [
        {
          name: 'delete',
          icon: 'delete-bin-5',
          label: () => {
            return this.$gettext('Delete')
          },
          handler: this.$_delete_showModal,
          isEnabled: () => true,
          componentType: 'oc-button',
          class: 'oc-files-actions-delete-trigger'
        }
      ]
    }
  },
  methods: {
    ...mapActions([
      'createModal',
      'hideModal',
      'setModalInputErrorMessage',
      'showMessage',
      'toggleModalConfirmButton'
    ]),

    $_delete_showModal(space) {
      const modal = {
        variation: 'danger',
        title: this.$gettext('Delete space') + ' ' + space.name,
        cancelText: this.$gettext('Cancel'),
        confirmText: this.$gettext('Delete'),
        icon: 'alarm-warning',
        message: this.$gettext('Are you sure you want to delete this space?'),
        hasInput: false,
        onCancel: this.hideModal,
        onConfirm: () => this.$_delete_deleteSpace(space.id)
      }

      this.createModal(modal)
    },

    $_delete_deleteSpace(id) {
      return this.graph.drives
        .deleteDrive(id)
        .then(() => {
          this.hideModal()
          this.loadSpacesTask.perform(this)
        })
        .catch((error) => {
          this.showMessage({
            title: this.$gettext('Deleting space failed…'),
            desc: error,
            status: 'danger'
          })
        })
    }
  }
}
