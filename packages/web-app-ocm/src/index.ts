import App from './views/App.vue'
import { defineWebApplication, useRouter } from '@ownclouders/web-pkg'
import translations from '../l10n/translations.json'
import { extensions } from './extensions'
import { RouteRecordRaw } from 'vue-router'
import { useGettext } from 'vue3-gettext'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: () => {
      return { name: 'ocm-app-invitations' }
    }
  },
  {
    path: '/invitations',
    name: 'ocm-app-invitations',
    component: App,
    meta: {
      patchCleanPath: true,
      title: 'Invitations'
    }
  }
]

export default defineWebApplication({
  setup(args) {
    const { $gettext } = useGettext()
    const router = useRouter()

    const appInfo = {
      name: $gettext('ScienceMesh'),
      id: 'ocm',
      icon: 'contacts-book',
      isFileEditor: false
    }

    router.addRoute({
      path: '/accept',
      redirect: () => {
        return { path: `/${appInfo.id}` }
      }
    })

    const navItems = [
      {
        name: $gettext('Invitations'),
        icon: 'user-shared',
        route: {
          path: `/${appInfo.id}/invitations?`
        },
        enabled: () => true
      }
    ]

    return {
      appInfo,
      routes,
      navItems,
      extensions: extensions(args),
      translations
    }
  }
})
