import { buildSpace } from 'web-client/src/helpers'
import { WebDAV } from 'web-client/src/webdav'
import { Drive } from 'web-client/src/generated'
import { useGettext } from 'vue3-gettext'
import { useConfigurationManager, useClientService } from 'web-pkg/src/composables'

export const useCreateSpace = () => {
  const { graphAuthenticated, webdav } = useClientService()
  const { $gettext } = useGettext()
  const configurationManager = useConfigurationManager()

  const createSpace = async (name: string) => {
    const { data: createdSpace } = await graphAuthenticated.drives.createDrive({ name }, {})
    const spaceResource = buildSpace({
      ...createdSpace,
      serverUrl: configurationManager.serverUrl
    })

    await webdav.createFolder(spaceResource, { path: '.space' })
    const markdown = await (webdav as WebDAV).putFileContents(spaceResource, {
      path: '.space/readme.md',
      content: $gettext('Here you can add a description for this Space.')
    })

    const { data: updatedSpace } = await graphAuthenticated.drives.updateDrive(
      createdSpace.id,
      {
        special: [
          {
            specialFolder: {
              name: 'readme'
            },
            id: markdown.id as string
          }
        ]
      } as Drive,
      {}
    )

    return buildSpace({ ...updatedSpace, serverUrl: configurationManager.serverUrl })
  }

  return { createSpace }
}
