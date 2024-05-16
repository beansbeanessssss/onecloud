import App from './App.vue'
import List from './views/List.vue'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import translations from '../l10n/translations.json'
import { ApplicationInformation, defineWebApplication } from '@ownclouders/web-pkg'
import { extensions } from './extensions'
import { extensionPoints } from './extensionPoints'

// just a dummy function to trick gettext tools
const $gettext = (msg: string) => {
  return msg
}

const appInfo: ApplicationInformation = {
  name: $gettext('Search'),
  id: 'search',
  icon: 'folder',
  isFileEditor: false
}

export default defineWebApplication({
  setup() {
    return {
      appInfo,
      routes: [
        {
          name: 'search',
          path: '/',
          component: App,
          children: [
            {
              name: 'provider-list',
              path: 'list/:page?',
              component: List,
              meta: {
                authContext: 'user',
                contextQueryItems: ['term', 'provider']
              }
            }
          ]
        }
      ],
      translations,
      extensions: extensions(),
      extensionPoints: extensionPoints()
    }
  }
})
