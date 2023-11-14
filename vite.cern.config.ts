import { defineConfig, searchForWorkspaceRoot } from 'vite'
import _defineConfig, { historyModePlugins } from './vite.config'
import { join } from 'path'

/**
 * NOTE: This is a special config file for CERN. It overwrites some of the code paths to implement custom logic
 * that only applies to CERN. It can and should be ignored in all other cases!
 *
 * Web can be run using this config via `pnpm build:w -c vite.cern.config.ts` or `pnpm vite -c vite.cern.config.ts`.
 */

const projectRootDir = searchForWorkspaceRoot(process.cwd())

export default defineConfig(async (args) => {
  let config
  if (typeof _defineConfig === 'function') {
    config = await _defineConfig(args)
  } else {
    config = _defineConfig
  }

  config.server = {
    port: 9201,
    strictPort: true
  }

  // collapsible table
  config.resolve.alias['design-system/src/components/OcTable/OcTable.vue'] = join(
    projectRootDir,
    'packages/web-pkg/src/cern/components/CollapsibleOcTable.vue'
  )
  // token info request
  config.resolve.alias['web-runtime/src/composables/tokenInfo'] = join(
    projectRootDir,
    'packages/web-pkg/src/cern/composables/useLoadTokenInfo'
  )
  // create space component
  config.resolve.alias['../../components/AppBar/CreateSpace.vue'] = join(
    projectRootDir,
    'packages/web-pkg/src/cern/components/CreateSpace.vue'
  )

  config.plugins.push(historyModePlugins()[0])

  return config
})
