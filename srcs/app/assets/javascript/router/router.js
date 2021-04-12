// views
import { HomeView } from '../views/home_view'
import { PongView } from '../views/pong/pong_view'
import { HeaderView } from '../views/headerView'
import { LeaderboardView } from '../views/leaderboard/leaderboardView'
import { TournamentView } from '../views/tournament/tournamentView'
import { OauthView } from '../views/oauth/oauthView'
import { GuildsView } from '../views/guild/guildsView'
import { DeclareWar } from '../views/guild/declareWarView'
import { FirstConnexionView } from '../views/oauth/firstConnexionView'
import { TwoFactorView } from '../views/oauth/twoFactorView'
import { ChatView } from '../views/chatView'
import { ManageGuildView } from '../views/guild/manageGuildView'
import { AdminView } from '../views/admin/adminView'
import { NotifView } from '../views/notifView'

// models
import { User } from '../models/userModel'
import { Channels } from '../collections/channels'

// controlers
import { ProfileController } from '../views/profile/profileController'
import { GuildController } from '../views/guild/guildController'

// models and collection
import { Guilds } from '../collections/guildsCollection'
import { Users } from '../collections/usersCollection'
import { Ladders } from '../collections/laddersCollection'
import { Wrapper } from '../models/wrapper'
import { SuperWrapper } from '../collections/superWrapper'
import { GameRecords } from '../collections/gameRecords'
import { Achievements } from '../collections/achievements'

// services
import { OauthService } from '../services/oauthService'
import { MyWebSocket } from '../services/websocket'

// Views for test only
import { TestView } from '../views/testView'
import { FetchAPI } from '../services/fetchAPI'

export const Router = Backbone.Router.extend({
  initialize: function () {
    this.userLogged = new User()
    this.headerView = new HeaderView({ model: this.userLogged })
    this.profileController = new ProfileController()
    this.guildController = new GuildController()
    this.superWrapper = undefined
    this.oauthService = new OauthService()
    this.chatView = undefined
    this.socket = undefined
    this.users = new Users()
    this.notifView = new NotifView({ collection: this.users })
    this.view = undefined
  },

  routes:
  {
    administration: 'admin_view',
    home: 'home_view',
    pong: 'pong_view',
    'profile/(:id)': 'profile_view',
    'profile/(:id)/': 'profile_view',
    guilds: 'guilds_view',
    'guild/(:id)': 'guild_view',
    'guild/(:id)/': 'guild_view',
    'chat/:id(/:page)': 'chat_view',
    chat: 'chat_view',
    leaderboard: 'leaderboard_view',
    tournament: 'tournaments_view',
    manage_guild: 'manage_guild_view',
    'declare_war/(:from_id)/(:on_id)': 'declare_war',
    connexion: 'connexion',
    exit: 'exit',
    firstConnexion: 'firstConnexion_view',
    two_factor_connexion: 'two_factor_connexion',
    twoFactor: 'twoFactor_view',
    '': 'oauth_view'
  },

  connexion: function (url) {
    // Two-Factor redirection
    this.urlParams = new URLSearchParams(window.location.search)
    if (this.urlParams.get('two_factor')) {
      window.localStorage.setItem('user_id', this.urlParams.get('user_id'))
      this.navigate('#twoFactor', { trigger: true })
      return
    }

    const fetchUser = async () => {
      this.oauthService.setAjaxEnvironnement()
      await this.setUpUser(this.users, this.oauthService, this.userLogged)
      this.userLogged.save({ first_login: true }, { patch: true })
      await this.initializeSocket()
      if (this.userLogged.get('first_login')) { this.navigate('#firstConnexion', { trigger: true }) } else {
        this.navigate('#home', { trigger: true })
      }
    }
    fetchUser()
  },

  setUpUser: async (users, oauthService, userLogged) => {
    oauthService.ajaxSetup()
    users.fetch()
    const response1 = users.fetch()
    const response2 = userLogged.fetchUser(window.localStorage.getItem('user_id'))
    await response2
  },

  two_factor_connexion: function (url) {
    const fetchUser = async () => {
      await this.setUpUser(this.users, this.oauthService, this.userLogged)
      this.initializeSocket()
      this.navigate('#home', { trigger: true })
    }
    fetchUser()
  },

  initializeSocket: function () {
    this.socket = new MyWebSocket(this)
    const fetchChannels = async () => {
      const myChannels = new Channels()
      await myChannels.fetchByUserId(window.localStorage.getItem('user_id'))
      for (let i = 0; i < myChannels.length; i++) {
        const currentChannel = myChannels.at(i)
        const channelId = currentChannel.get('id')
        if (currentChannel.get('ban_ids').some(el => el == this.userLoggedId) === false) {
          this.socket.subscribeChannel(channelId, 'ActivityChannel')
          this.socket.subscribeChannel(channelId, 'ChatChannel')
        }
      }
    }
    fetchChannels()
  },

  accessPage: function (url) {
    // prevent zombie views
    if (this.view !== undefined) {
      this.remove_view()
    }
    if (window.localStorage.getItem('access-token') === null) {
      this.oauth_view()
      return 1
    } else if (performance.navigation.type >= 1 && performance.navigation.type <= 2) {
      const fetchUser = async () => {
        this.initializeSocket()
        await this.setUpUser(this.users, this.oauthService, this.userLogged)
        if (url !== 'firstConnexion' && url !== 'twoFactor') { this.headerView.render() }
      }
      fetchUser()
    }
  },

  firstConnexion_view: function () {
    if (this.accessPage('firstConnexion')) { return }
    const firstConnexionView = new FirstConnexionView({ model: this.userLogged })
  },

  twoFactor_view: function () {
    if (this.accessPage()) { return }
    const twoFactorView = new TwoFactorView()
  },

  exit: function () {
    if (this.accessPage()) { return }
    this.socket.close()
    const fetchAPI = new FetchAPI()
    fetchAPI.exit()
    window.localStorage.clear()
    this.oauth_view()
  },

  admin_view: function () {
    if (this.accessPage()) { return }
    const adminView = new AdminView({ model: this.loadWrapper() })
  },

  oauth_view: function (url) {
    if (this.headerView !== undefined) { this.headerView.remove() }
    history.replaceState({}, null, '/')
    const oauthView = new OauthView()
  },

  home_view: function (url) {
    if (this.accessPage()) { return }
    this.headerView.render()
    this.view = new HomeView({ socket: this.socket, notifView: this.notifView })
  },

  pong_view: function (url) {
    if (this.accessPage()) { return }
    // if (this.view != undefined) { this.view.undelegateEvents() }
    this.view = new PongView()
  },

  profile_view: function (id, page) {
    if (this.accessPage()) { return }
    console.log('profile view')
    // if (this.view != undefined) { this.view.undelegateEvents() }
    this.view = this.profileController.loadView(id, this.loadWrapper())
  },

  guilds_view: function () {
    if (this.accessPage()) { return }
    // if (this.view != undefined) { this.view.undelegateEvents() }
    this.view = new GuildsView({ socket: this.socket, notifView: this.notifView })
  },

  guild_view: function (id, page) {
    if (this.accessPage()) { return }
    // if (this.view != undefined) { this.view.undelegateEvents() }
    this.view = this.guildController.loadView(id, this.loadWrapper())
  },

  chat_view: function (id, page) {
    if (this.accessPage()) { return }
    // if (this.view != undefined) { this.view.undelegateEvents() }
    this.view = new ChatView({ socket: this.socket, notifView: this.notifView })
  },

  leaderboard_view: function () {
    if (this.accessPage()) { return }
    // if (this.view != undefined) { this.view.undelegateEvents() }
    this.view = new LeaderboardView({ socket: this.socket, notifView: this.notifView })
  },

  tournaments_view: function () {
    if (this.accessPage()) { return }
    // if (this.view != undefined) { this.view.undelegateEvents() }
    this.view = new TournamentView()
  },

  test_view: function () {
    if (this.accessPage()) { return }
    const testView = new TestView({ model: this.loadWrapper() })
  },

  manage_guild_view: function () {
    if (this.accessPage()) { return }
    // if (this.view != undefined) { this.view.undelegateEvents() }
    // if (this.view != undefined) { this.view.undelegateEvents() }
    this.view = new ManageGuildView({ model: this.loadWrapper() })
  },

  declare_war: function (fromId, onId) {
    if (this.accessPage()) { return }
    const declareWar = new DeclareWar({ fromId: fromId, onId: onId, router: this })
  },

  loadWrapper: function () {
    return new SuperWrapper({
      users: new Wrapper({ obj: new Users() }),
      guilds: new Wrapper({ obj: new Guilds() }),
      ladders: new Wrapper({ obj: new Ladders() }),
      gameRecords: new Wrapper({ obj: new GameRecords() }),
      achievements: new Wrapper({ obj: new Achievements() }),
      userLoggedId: window.localStorage.getItem('user_id'),
      router: this
    })
  },

  remove_view: function () {
    // this._removeElement();
    this.view.$el.empty()
    try {
      // this.socket.updateContext(this.notifView)
      // this.view.destroy()
    } catch (e) {
    }
    this.view.stopListening()
    this.view.undelegateEvents()
    this.view = undefined
    return this
  }
})
