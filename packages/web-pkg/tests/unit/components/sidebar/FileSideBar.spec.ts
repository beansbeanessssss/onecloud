import FileSideBar from '../../../../src/components/SideBar/FileSideBar.vue'
import {
  CollaboratorShare,
  Resource,
  SpaceResource,
  buildCollaboratorShare,
  buildLinkShare
} from '@ownclouders/web-client'
import { mock } from 'vitest-mock-extended'
import {
  defaultComponentMocks,
  defaultPlugins,
  mockAxiosResolve,
  RouteLocation,
  shallowMount
} from 'web-test-helpers'
import { defineComponent, ref } from 'vue'
import { useSelectedResources } from '../../../../src/composables/selection'
import {
  useExtensionRegistry,
  useResourcesStore,
  useSharesStore,
  useSpacesStore
} from '../../../../src/composables/piniaStores'
import {
  CollectionOfPermissionsWithAllowedValues,
  Permission,
  SharingLink
} from '@ownclouders/web-client/graph/generated'
import { AncestorMetaDataValue } from '../../../../src'

const InnerSideBarComponent = defineComponent({
  props: { availablePanels: { type: Array, required: true } },
  template: '<div id="foo"><slot name="header"></slot></div>'
})

vi.mock('../../../../src/composables/selection', () => ({ useSelectedResources: vi.fn() }))

vi.mock('@ownclouders/web-client', async (importOriginal) => ({
  ...(await importOriginal<any>()),
  buildLinkShare: vi.fn((share) => share),
  buildCollaboratorShare: vi.fn((share) => share)
}))

const selectors = {
  sideBar: '.files-side-bar',
  fileInfoStub: 'file-info-stub',
  spaceInfoStub: 'space-info-stub'
}

describe('FileSideBar', () => {
  describe('isOpen', () => {
    it.each([true, false])(
      'should show or hide the sidebar according to the isOpen prop',
      (isOpen) => {
        const { wrapper } = createWrapper({ isOpen })
        expect(wrapper.find(selectors.sideBar).exists()).toBe(isOpen)
      }
    )
  })
  describe('file info header', () => {
    it('should show when one resource selected', async () => {
      const item = mock<Resource>({ path: '/someFolder' })
      const { wrapper } = createWrapper({ item })
      wrapper.vm.loadedResource = item
      await wrapper.vm.$nextTick()
      expect(wrapper.find(selectors.fileInfoStub).exists()).toBeTruthy()
    })
    it('not show when no resource selected', () => {
      const { wrapper } = createWrapper()
      expect(wrapper.find(selectors.fileInfoStub).exists()).toBeFalsy()
    })
    it('should not show when selected resource is a project space', async () => {
      const item = mock<SpaceResource>({ path: '/someFolder', driveType: 'project' })
      const { wrapper } = createWrapper({ item })
      wrapper.vm.loadedResource = item
      await wrapper.vm.$nextTick()
      expect(wrapper.find(selectors.fileInfoStub).exists()).toBeFalsy()
    })
  })
  describe('space info header', () => {
    it('should show when one project space resource selected', async () => {
      const item = mock<SpaceResource>({ path: '/someFolder', driveType: 'project' })
      const { wrapper } = createWrapper({ item })
      wrapper.vm.loadedResource = item
      await wrapper.vm.$nextTick()
      expect(wrapper.find(selectors.spaceInfoStub).exists()).toBeTruthy()
    })
    it('not show when no resource selected', () => {
      const { wrapper } = createWrapper()
      expect(wrapper.find(selectors.spaceInfoStub).exists()).toBeFalsy()
    })
    it('should not show when selected resource is not a project space', async () => {
      const item = mock<Resource>({ path: '/someFolder' })
      const { wrapper } = createWrapper({ item })
      wrapper.vm.loadedResource = item
      await wrapper.vm.$nextTick()
      expect(wrapper.find(selectors.spaceInfoStub).exists()).toBeFalsy()
    })
  })
  describe('loadSharesTask', () => {
    it('sets the loading state correctly', async () => {
      const resource = mock<Resource>()
      const { wrapper, mocks } = createWrapper()

      mocks.$clientService.graphAuthenticated.permissions.listPermissions.mockResolvedValue(
        mockAxiosResolve(mock<CollectionOfPermissionsWithAllowedValues>({ value: [] }))
      )

      const { setLoading } = useSharesStore()
      await wrapper.vm.loadSharesTask.perform(resource)

      expect(setLoading).toHaveBeenCalledTimes(2)
    })
    it('sets direct collaborator and link shares', async () => {
      const resource = mock<Resource>()
      const { wrapper, mocks } = createWrapper()

      const collaboratorShare = { link: undefined } as Permission
      const linkShare = { link: mock<SharingLink>() } as Permission
      mocks.$clientService.graphAuthenticated.permissions.listPermissions.mockResolvedValue(
        mockAxiosResolve(
          mock<CollectionOfPermissionsWithAllowedValues>({ value: [collaboratorShare, linkShare] })
        )
      )

      const { setCollaboratorShares, setLinkShares } = useSharesStore()
      await wrapper.vm.loadSharesTask.perform(resource)

      expect(buildCollaboratorShare).toHaveBeenCalledWith(
        expect.objectContaining({ graphPermission: collaboratorShare })
      )
      expect(buildLinkShare).toHaveBeenCalledWith(
        expect.objectContaining({ graphPermission: linkShare })
      )

      expect(setCollaboratorShares).toHaveBeenCalledWith([expect.anything()])
      expect(setLinkShares).toHaveBeenCalledWith([expect.anything()])
    })
    it('sets indirect shares', async () => {
      const resource = mock<Resource>()
      const { wrapper, mocks } = createWrapper()

      mocks.$clientService.graphAuthenticated.permissions.listPermissions.mockResolvedValueOnce(
        mockAxiosResolve(mock<CollectionOfPermissionsWithAllowedValues>({ value: [] }))
      )

      const collaboratorShare = { link: undefined } as Permission
      mocks.$clientService.graphAuthenticated.permissions.listPermissions.mockResolvedValueOnce(
        mockAxiosResolve(
          mock<CollectionOfPermissionsWithAllowedValues>({ value: [collaboratorShare] })
        )
      )

      const resourcesStore = useResourcesStore()
      resourcesStore.ancestorMetaData = { '/foo': mock<AncestorMetaDataValue>({ id: '1' }) }

      await wrapper.vm.loadSharesTask.perform(resource)

      expect(
        mocks.$clientService.graphAuthenticated.permissions.listPermissions
      ).toHaveBeenCalledTimes(2)

      expect(buildCollaboratorShare).toHaveBeenCalledWith(
        expect.objectContaining({ graphPermission: collaboratorShare })
      )
    })
    it('calls "setSpaceMembers" for space resources', async () => {
      const resource = mock<SpaceResource>({ id: '1', driveType: 'project' })
      const { wrapper, mocks } = createWrapper()

      mocks.$clientService.graphAuthenticated.permissions.listPermissions.mockResolvedValue(
        mockAxiosResolve(mock<CollectionOfPermissionsWithAllowedValues>({ value: [] }))
      )

      const { setSpaceMembers } = useSpacesStore()
      await wrapper.vm.loadSharesTask.perform(resource)

      expect(setSpaceMembers).toHaveBeenCalled()
    })
    it('calls "loadSpaceMembers" if current space is a project space', async () => {
      const resource = mock<Resource>()
      const space = mock<SpaceResource>({ id: '1', driveType: 'project' })
      const { wrapper, mocks } = createWrapper({ space })

      mocks.$clientService.graphAuthenticated.permissions.listPermissions.mockResolvedValue(
        mockAxiosResolve(mock<CollectionOfPermissionsWithAllowedValues>({ value: [] }))
      )

      const { loadSpaceMembers } = useSpacesStore()
      await wrapper.vm.loadSharesTask.perform(resource)

      expect(loadSpaceMembers).toHaveBeenCalled()
    })
    describe('cache', () => {
      it('is being used in non-flat file lists', async () => {
        const resource = mock<Resource>()
        const { wrapper, mocks } = createWrapper()

        mocks.$clientService.graphAuthenticated.permissions.listPermissions.mockResolvedValue(
          mockAxiosResolve(mock<CollectionOfPermissionsWithAllowedValues>({ value: [] }))
        )

        const sharesStore = useSharesStore()
        sharesStore.collaboratorShares = [mock<CollaboratorShare>()]

        await wrapper.vm.loadSharesTask.perform(resource)

        expect(sharesStore.setCollaboratorShares).toHaveBeenCalledWith([expect.anything()])
      })
      it('is not being used in flat file lists', async () => {
        const resource = mock<Resource>()
        const { wrapper, mocks } = createWrapper({ currentRouteName: 'files-shares-with-me' })

        mocks.$clientService.graphAuthenticated.permissions.listPermissions.mockResolvedValue(
          mockAxiosResolve(mock<CollectionOfPermissionsWithAllowedValues>({ value: [] }))
        )

        const sharesStore = useSharesStore()
        sharesStore.collaboratorShares = [mock<CollaboratorShare>()]

        await wrapper.vm.loadSharesTask.perform(resource)

        expect(sharesStore.setCollaboratorShares).toHaveBeenCalledWith([])
      })
      it('is not being used on projects overview', async () => {
        const resource = mock<Resource>()
        const { wrapper, mocks } = createWrapper({ currentRouteName: 'files-spaces-projects' })

        mocks.$clientService.graphAuthenticated.permissions.listPermissions.mockResolvedValue(
          mockAxiosResolve(mock<CollectionOfPermissionsWithAllowedValues>({ value: [] }))
        )

        const sharesStore = useSharesStore()
        sharesStore.collaboratorShares = [mock<CollaboratorShare>()]

        await wrapper.vm.loadSharesTask.perform(resource)

        expect(sharesStore.setCollaboratorShares).toHaveBeenCalledWith([])
      })
    })
  })
})

function createWrapper({
  item = undefined,
  isOpen = true,
  currentRouteName = 'files-spaces-generic',
  space = undefined
}: { item?: Resource; isOpen?: boolean; currentRouteName?: string; space?: SpaceResource } = {}) {
  const plugins = defaultPlugins()

  const { requestExtensions } = useExtensionRegistry()
  vi.mocked(requestExtensions).mockReturnValue([])

  vi.mocked(useSelectedResources).mockReturnValue(
    mock<ReturnType<typeof useSelectedResources>>({
      selectedResources: item ? ref([item]) : ref([])
    })
  )

  const mocks = defaultComponentMocks({
    currentRoute: mock<RouteLocation>({ name: currentRouteName })
  })
  return {
    mocks,
    wrapper: shallowMount(FileSideBar, {
      props: {
        isOpen,
        space
      },
      global: {
        plugins,
        renderStubDefaultSlot: true,
        stubs: {
          InnerSideBar: InnerSideBarComponent
        },
        mocks,
        provide: mocks
      }
    })
  }
}
