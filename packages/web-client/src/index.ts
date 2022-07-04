import axios, { AxiosInstance, AxiosPromise, AxiosResponse } from 'axios'
import {
  Configuration,
  MeDrivesApi,
  Drive,
  DrivesApiFactory,
  CollectionOfDrives,
  UserApiFactory,
  User,
  MeUserApiFactory,
  UsersApiFactory,
  GroupsApiFactory,
  MeChangepasswordApiFactory,
  Group,
  CollectionOfGroup,
  CollectionOfUser,
  GroupApiFactory
} from './generated'

export interface Graph {
  drives: {
    listMyDrives: (orderBy?: string, filter?: string) => Promise<AxiosResponse<CollectionOfDrives>>
    getDrive: (id: string) => AxiosPromise<Drive>
    createDrive: (drive: Drive, options: any) => AxiosPromise<Drive>
    updateDrive: (id: string, drive: Drive, options: any) => AxiosPromise<Drive>
    deleteDrive: (id: string, ifMatch: string, options: any) => AxiosPromise<void>
  }
  users: {
    getUser: (userId: string) => AxiosPromise<User>
    createUser: (user: User) => AxiosPromise<User>
    getMe: () => AxiosPromise<User>
    changeOwnPassword: (currentPassword: string, newPassword: string) => AxiosPromise<void>
    editUser: (userId: string, user: User) => AxiosPromise<User>
    deleteUser: (userId: string) => AxiosPromise<void>
    listUsers: (orderBy?: string) => AxiosPromise<CollectionOfUser>
  }
  groups: {
    listGroups: (orderBy?: string) => AxiosPromise<CollectionOfGroup>
    createGroup: (group: Group) => AxiosPromise<Group>
    editGroup: (groupId: string, group: Group) => AxiosPromise<void>
    deleteGroup: (groupId: string) => AxiosPromise<void>
    addMember: (groupId: string, userId: string, server: string) => AxiosPromise<void>
    deleteMember: (groupId: string, userId: string) => AxiosPromise<void>
  }
}

const graph = (baseURI: string, axiosClient: AxiosInstance): Graph => {
  const basePath = new URL('/graph/v1.0', baseURI).href
  const config = new Configuration({
    basePath
  })

  const meDrivesApi = new MeDrivesApi(config, config.basePath, axiosClient)
  const meUserApiFactory = MeUserApiFactory(config, config.basePath, axiosClient)
  const meChangepasswordApi = MeChangepasswordApiFactory(config, config.basePath, axiosClient)
  const userApiFactory = UserApiFactory(config, config.basePath, axiosClient)
  const usersApiFactory = UsersApiFactory(config, config.basePath, axiosClient)
  const groupApiFactory = GroupApiFactory(config, config.basePath, axiosClient)
  const groupsApiFactory = GroupsApiFactory(config, config.basePath, axiosClient)
  const drivesApiFactory = DrivesApiFactory(config, config.basePath, axiosClient)

  return <Graph>{
    drives: {
      listMyDrives: (orderBy?: string, filter?: string) =>
        meDrivesApi.listMyDrives(0, 0, orderBy, filter),
      getDrive: (id: string) => drivesApiFactory.getDrive(id),
      createDrive: (drive: Drive, options: any): AxiosPromise<Drive> =>
        drivesApiFactory.createDrive(drive, options),
      updateDrive: (id: string, drive: Drive, options: any): AxiosPromise<Drive> =>
        drivesApiFactory.updateDrive(id, drive, options),
      deleteDrive: (id: string, ifMatch: string, options: any): AxiosPromise<void> =>
        drivesApiFactory.deleteDrive(id, ifMatch, options)
    },
    users: {
      getUser: (userId: string) => userApiFactory.getUser(userId),
      createUser: (user: User) => usersApiFactory.createUser(user),
      getMe: () => meUserApiFactory.meGet(),
      changeOwnPassword: (currentPassword, newPassword) =>
        meChangepasswordApi.changeOwnPassword({ currentPassword, newPassword }),
      editUser: (userId: string, user: User) => userApiFactory.updateUser(userId, user),
      deleteUser: (userId: string) => userApiFactory.deleteUser(userId),
      listUsers: (orderBy?: any) =>
        usersApiFactory.listUsers(
          0,
          0,
          '',
          '',
          false,
          new Set<any>([orderBy]),
          new Set<any>([]),
          new Set<any>(['memberOf'])
        )
    },
    groups: {
      createGroup: (group: Group) => groupsApiFactory.createGroup(group),
      editGroup: (groupId: string, group: Group) => groupApiFactory.updateGroup(groupId, group),
      deleteGroup: (groupId: string) => groupApiFactory.deleteGroup(groupId),
      listGroups: (orderBy?: any) =>
        groupsApiFactory.listGroups(
          0,
          0,
          '',
          '',
          false,
          new Set<any>([orderBy]),
          new Set<any>([]),
          new Set<any>(['members'])
        ),
      addMember: (groupId: string, userId: string, server: string) => {
        groupApiFactory.addMember(groupId, { '@odata.id': `${server}graph/v1.0/users/${userId}` })
      },
      deleteMember: (groupId: string, userId: string) => {
        groupApiFactory.deleteMember(groupId, userId)
      }
    }
  }
}

interface Client {
  graph: Graph
}

export const client = (baseURI: string, token: string): Client => {
  const axiosClient = axios.create({
    headers: {
      authorization: 'Bearer ' + token,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })

  axiosClient.interceptors.request.use((config) => {
    config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
    return config
  })

  return {
    graph: graph(baseURI, axiosClient)
  }
}
