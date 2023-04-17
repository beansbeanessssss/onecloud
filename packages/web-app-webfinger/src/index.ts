import translations from '../l10n/translations.json'
import Resolve from './views/Resolve.vue'

// just a dummy function to trick gettext tools
function $gettext(msg) {
  return msg
}

const appInfo = {
  name: $gettext('Webfinger'),
  id: 'webfinger',
  icon: 'fingerprint',
  isFileEditor: false
}

const routes = () => [
  {
    path: '/',
    redirect: () => {
      return { name: 'webfinger-resolve' }
    }
  },
  {
    path: '/resolve',
    name: 'webfinger-resolve',
    component: Resolve,
    meta: {
      authContext: 'user',
      title: $gettext('Resolve ownCloud')
    }
  }
]

export default {
  appInfo,
  routes,
  translations
}
