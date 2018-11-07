'use strict'

import Vue from 'vue'
import Vuex from 'vuex'
import VuexPersistence from 'vuex-persist'

/* STORE MODULES
*/
import config from './config'
import user from './user'

Vue.use(Vuex)

const vuexPersist = new VuexPersistence({
  storage: window.localStorage,
  filter: (mutation) => (['SET_USER', 'SET_TOKEN'].indexOf(mutation.type) > -1),
  modules: ['user']
})

const strict = process.env.NODE_ENV === 'development'

export const Store = new Vuex.Store({
    // state: {
    //   someModulelessState: 0
    // },
    plugins: [vuexPersist.plugin],
    modules: {
      user,
      config
    },
    strict
  })


export default Store
