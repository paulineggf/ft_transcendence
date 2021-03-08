import { FetchAPI } from '../services/fetchAPI'
import { SuperHeaders } from '../services/headers'

export const User = Backbone.Model.extend({
  defaults: {
    chat_ids: [],
    first_login: undefined,
    guild_id: undefined,
    id: undefined,
    image_url: undefined,
    ladder_games_lost: undefined,
    ladder_games_won: undefined,
    ladder_id: undefined,
    nickname: undefined,
    status: undefined,
    two_factor: undefined,
    uid: undefined,
    friends: [],
    ignores: []
  },

  initialize: function (url) {
    this.superHeaders = new SuperHeaders()
    this.headers = this.superHeaders.getHeaders()
  },

  urlRoot: '/api/users/',

  url: function () {
    if (this.id !== undefined) {
      return this.urlRoot + this.id
    }
    if (this.avatar !== undefined) {
      return this.urlRoot + this.id + '/avatar'
    }
    return this.urlRoot
  },

  fetchUser: function (url) {
    return this.fetch({
      url: this.urlRoot + url,
      success: function (response) {
      },
      error: function (errorResponse) {
      }
    })
  },

  saveNickname: function (nickname) {
    this.set({ nickname: nickname })
    return this.save({ nickname: this.get('nickname') }, {
      patch: true,
      success: function (response) {
      },
      error: function (data, statusText) {
      }
    })
  },

  saveImage: async function (data) {
    const fetchAPI = new FetchAPI()
    const url = this.urlRoot + this.id + '/avatar'
    return fetchAPI.saveImage(url, data)
  },

  saveFirstLogin: function (firstLogin) {
    this.set({ first_login: firstLogin })
    this.save({ first_login: firstLogin }, { patch: true })
  },

  block: function (id) {
    const header = this.superHeaders.getHeaders()
    header.append('accept', 'application/json')
    header.append('Content-Type', 'application/json')
    const url = '/api/users/' + this.id + '/ignores'
    fetch(url, {
      method: 'POST',
      headers: header,
      body: JSON.stringify({
        ignored_id: id
      })
    })
  },
  unblock: function (id) {
    const header = this.superHeaders.getHeaders()
    header.append('accept', 'application/json')
    header.append('Content-Type', 'application/json')
    const url = '/api/users/' + this.id + '/ignores/' + id
    fetch(url, {
      method: 'DELETE',
      headers: header
    })
  }
})
