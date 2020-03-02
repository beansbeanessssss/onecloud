const chromedriver = require('chromedriver')
const withHttp = url => /^https?:\/\//i.test(url) ? url : `http://${url}`

const LOCAL_LAUNCH_URL = withHttp(process.env.SERVER_HOST || 'http://localhost:8300')
const LOCAL_BACKEND_URL = withHttp(process.env.BACKEND_HOST || 'http://localhost:8080')
const REMOTE_BACKEND_URL = process.env.REMOTE_BACKEND_HOST ? withHttp(process.env.REMOTE_BACKEND_HOST || 'http://localhost:8080') : undefined
const BACKEND_ADMIN_USERNAME = process.env.BACKEND_USERNAME || 'admin'
const BACKEND_ADMIN_PASSWORD = process.env.BACKEND_PASSWORD || 'admin'
const SELENIUM_HOST = process.env.SELENIUM_HOST || ''
const SELENIUM_PORT = process.env.SELENIUM_PORT || 4444
const START_PROCESS = (SELENIUM_HOST === '')
const REMOTE_UPLOAD_DIR = process.env.REMOTE_UPLOAD_DIR || require('path').join(__dirname, '/tests/acceptance/filesForUpload/')
const SAUCE_USERNAME = process.env.SAUCE_USERNAME
const SAUCE_ACCESS_KEY = process.env.SAUCE_ACCESS_KEY
const BROWSER_NAME = process.env.BROWSER_NAME
const SAUCELABS_TUNNEL_NAME = process.env.SAUCELABS_TUNNEL_NAME
const LOCAL_UPLOAD_DIR = process.env.LOCAL_UPLOAD_DIR || '/uploads'

module.exports = {
  page_objects_path: './tests/acceptance/pageObjects',
  custom_commands_path: './tests/acceptance/customCommands',
  test_settings: {
    default: {
      launch_url: LOCAL_LAUNCH_URL,
      globals: {
        waitForConditionTimeout: 20000,
        waitForConditionPollInterval: 10,
        filesForUpload: REMOTE_UPLOAD_DIR,
        mountedUploadDir: LOCAL_UPLOAD_DIR,
        backend_url: LOCAL_BACKEND_URL,
        remote_backend_url: REMOTE_BACKEND_URL,
        backend_admin_username: BACKEND_ADMIN_USERNAME,
        backend_admin_password: BACKEND_ADMIN_PASSWORD,
        default_backend: 'LOCAL'
      },
      selenium_host: SELENIUM_HOST,
      desiredCapabilities: {
        browserName: BROWSER_NAME || 'chrome',
        javascriptEnabled: true,
        acceptSslCerts: true,
        chromeOptions: {
          args: ['disable-gpu'],
          w3c: false
        },
        loggingPrefs: { browser: 'ALL' }
      },
      webdriver: {
        start_process: false,
        port: SELENIUM_PORT,
        use_legacy_jsonwire: false
      },
      screenshots: {
        enabled: true,
        path: 'tests/reports/screenshots',
        on_failure: true
      }
    },
    local: {
      globals: {
        waitForConditionTimeout: 10000
      },
      webdriver: {
        start_process: START_PROCESS,
        server_path: chromedriver.path,
        cli_args: ['--port=' + SELENIUM_PORT]
      }
    },
    drone: {
      selenium_host: 'selenium',
      screenshots: {
        enabled: !SAUCE_USERNAME,
        path: 'tests/reports/screenshots',
        on_failure: !SAUCE_USERNAME
      },
      desiredCapabilities: {
        chromeOptions: {
          args: ['disable-gpu', 'disable-dev-shm-usage'],
          w3c: false
        },
        idleTimeout: 180
      }
    },
    saucelabs: {
      desiredCapabilities: {
        tunnelIdentifier: SAUCELABS_TUNNEL_NAME,
        screenResolution: '1280x1024',
        username: SAUCE_USERNAME,
        access_key: SAUCE_ACCESS_KEY,
        idleTimeout: 180
      }
    }
  }
}
