import { mock, mockDeep } from 'jest-mock-extended'
import { createApp, defineComponent, App } from 'vue'
import { ConfigurationManager, useAppsStore } from '@ownclouders/web-pkg'
import {
  initializeApplications,
  announceApplicationsReady,
  announceCustomScripts,
  announceCustomStyles,
  announceConfiguration
} from '../../../src/container/bootstrap'
import { buildApplication } from '../../../src/container/application'
import { createTestingPinia } from 'web-test-helpers/src'

jest.mock('../../../src/container/application')

describe('initialize applications', () => {
  it('continues even if one or more applications are falsy', async () => {
    const fishyError = new Error('fishy')
    const initialize = jest.fn()
    const ready = jest.fn()
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn)
    const buildApplicationMock = jest
      .fn()
      .mockImplementation(({ applicationPath }: { applicationPath: string }) => {
        if (applicationPath.includes('Valid')) {
          return Promise.resolve({ initialize, ready })
        }

        return Promise.reject(fishyError)
      })

    jest.mocked(buildApplication).mockImplementation(buildApplicationMock)

    const applications = await initializeApplications({
      app: createApp(defineComponent({})),
      configurationManager: mockDeep<ConfigurationManager>(),
      runtimeConfiguration: {
        apps: ['internalFishy', 'internalValid'],
        external_apps: [{ path: 'externalFishy' }, { path: 'externalValid' }]
      },
      store: undefined,
      router: undefined,
      gettext: undefined,
      supportedLanguages: {}
    })

    expect(buildApplicationMock).toHaveBeenCalledTimes(4)
    expect(initialize).toHaveBeenCalledTimes(2)
    expect(errorSpy).toHaveBeenCalledTimes(2)
    expect(errorSpy.mock.calls[0][0]).toMatchObject(fishyError)
    expect(errorSpy.mock.calls[1][0]).toMatchObject(fishyError)

    createTestingPinia()
    await announceApplicationsReady({
      app: mock<App>(),
      appsStore: useAppsStore(),
      applications
    })
    expect(ready).toHaveBeenCalledTimes(2)
  })
})

describe('announceCustomScripts', () => {
  afterEach(() => {
    document.getElementsByTagName('html')[0].innerHTML = ''
  })

  it('injects basic scripts', () => {
    announceCustomScripts({
      runtimeConfiguration: { scripts: [{ src: 'foo.js' }, { src: 'bar.js' }] }
    })
    const elements = document.getElementsByTagName('script')
    expect(elements.length).toBe(2)
  })

  it('skips the injection if no src option is provided', () => {
    announceCustomScripts({ runtimeConfiguration: { scripts: [{}, {}, {}, {}, {}] } })
    const elements = document.getElementsByTagName('script')
    expect(elements.length).toBeFalsy()
  })

  it('loads scripts synchronous by default', () => {
    announceCustomScripts({ runtimeConfiguration: { scripts: [{ src: 'foo.js' }] } })
    const element = document.querySelector<HTMLScriptElement>('[src="foo.js"]')
    expect(element.async).toBeFalsy()
  })

  it('injects scripts async if the corresponding configurations option is set', () => {
    announceCustomScripts({ runtimeConfiguration: { scripts: [{ src: 'foo.js', async: true }] } })
    const element = document.querySelector<HTMLScriptElement>('[src="foo.js"]')
    expect(element.async).toBeTruthy()
  })
})

describe('announceCustomStyles', () => {
  afterEach(() => {
    document.getElementsByTagName('html')[0].innerHTML = ''
  })

  it('injects basic styles', () => {
    const styles = [{ href: 'foo.css' }, { href: 'bar.css' }]
    announceCustomStyles({ runtimeConfiguration: { styles } })

    styles.forEach(({ href }) => {
      const element = document.querySelector<HTMLLinkElement>(`[href="${href}"]`)
      expect(element).toBeTruthy()
      expect(element.type).toBe('text/css')
      expect(element.rel).toBe('stylesheet')
    })
  })

  it('skips the injection if no href option is provided', () => {
    announceCustomStyles({ runtimeConfiguration: { styles: [{}, {}] } })
    const elements = document.getElementsByTagName('link')
    expect(elements.length).toBeFalsy()
  })
})

describe('announceConfiguration', () => {
  it('should not enable embed mode when it is not set', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(mock<Response>({ status: 200, json: () => Promise.resolve({}) }))
    const config = await announceConfiguration('/config.json')
    expect(config.options.embed.enabled).toStrictEqual(false)
  })

  it('should embed mode when it is set in config.json', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      mock<Response>({
        status: 200,
        json: () => Promise.resolve({ options: { embed: { enabled: true } } })
      })
    )
    const config = await announceConfiguration('/config.json')
    expect(config.options.embed.enabled).toStrictEqual(true)
  })

  it('should enable embed mode when it is set in URL query but config.json does not set it', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        search: '?embed=true'
      },
      writable: true
    })
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(mock<Response>({ status: 200, json: () => Promise.resolve({}) }))
    const config = await announceConfiguration('/config.json')
    expect(config.options.embed.enabled).toStrictEqual(true)
  })

  it('should not enable the embed mode when it is set in URL query but config.json disables it', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        search: '?embed=true'
      },
      writable: true
    })
    jest.spyOn(global, 'fetch').mockResolvedValue(
      mock<Response>({
        status: 200,
        json: () => Promise.resolve({ options: { embed: { enabled: false } } })
      })
    )
    const config = await announceConfiguration('/config.json')
    expect(config.options.embed.enabled).toStrictEqual(false)
  })
})
