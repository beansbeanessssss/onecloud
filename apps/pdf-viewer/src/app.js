import '@babel/polyfill'
import translationsJson from '../l10n/translations'

const store = require('./store.js')

let pdf = import('./PdfViewer.vue')
const PdfViewer = () => ({
  component: pdf
})

const routes = [{
  path: `/pdf-viewer`,
  components: {
    appContent: PdfViewer
  },
  name: 'pdf-viewer'
}]

const appInfo = {
  name: 'PDFViewer',
  id: 'pdf-viewer',
  icon: 'application-pdf',
  isFileEditor: true,
  extensions: [{
    extension: 'pdf'
  }
  ]
}

const translations = translationsJson
export default define({
  appInfo,
  routes,
  store,
  translations
})
