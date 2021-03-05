import { Users } from '../collections/users_collection'
import { ChatModel } from '../models/chatModel'
import { User } from '../models/user_model'
import { Channels } from '../collections/channels'

export const ChatView = Backbone.View.extend({
  events: {
    'click .add_channel': 'openModalCreateChannel',
    'click .createChannel': 'createChannel',
    'click .closeModal': 'modalClose',
    'keyup .input': 'sendMessage',
    'click .eachFriendModalCreateChannel': 'selectCheckbox',
    'click .eachFriendModalCreateDirectMessages': 'createDM',
    'keyup .search': 'modalSearchFriends',
    'keyup .inputModalSearchAllChannels': 'inputModalSearchAllChannels',
    'click .add_direct_messages': 'openModalCreateDM',
    'click .close-icon': 'deleteChannelConfirmation',
    'click .search_channel': 'openModalSearchChannel',
    'click .eachChannel': 'subscribeChannel',
    'click .yes': 'deleteChannel',
    'click .no': 'modalClose'
  },
  initialize: function () {
    this.myChannels = this.model.get('myChannels').get('obj')
    this.channels = this.model.get('channels').get('obj')
    this.users = this.model.get('users').get('obj')
    this.userLogged = new User()

    this.userLogged.fetchUser(window.localStorage.getItem('user_id'))

    this.myChannels.on('remove', function () {
      this.channels.fetchAllChannels()
    }, this)

    this.listenTo(this.myChannels, 'sync', function () {
      this.listenTo(this.users, 'sync', function () {
        this.render()
      }, this)
    }, this)
  },
  defaults: {
    myChannels: undefined,
    channels: undefined,
    userLogged: undefined,
    users: undefined
  },
  el: $('#app'),
  render: function () {
    this.templateChat = Handlebars.templates.chat
    const array = {}

    // if multiple participants right side open

    // my channels
    const channels = this.myChannels.slice().filter(el => el.get('privacy') !== 'direct_message')
    array.myChannels = Array()
    for (let i = 0; i < channels.length; i++) {
      array.myChannels.push(JSON.parse(JSON.stringify(channels[i])))
      array.myChannels[i].admin = channels[i].get('admin_ids').find(el => el === this.userLogged.get('id'))
    }

    // direct messages
    const DM = this.myChannels.slice().filter(el => el.get('privacy') === 'direct_message')
    array.DM = Array()
    for (let i = 0; i < DM.length; i++) {
      array.DM.push(JSON.parse(JSON.stringify(DM[i])))
      const id = DM[i].get('participant_ids').find(el => el !== this.userLogged.get('id'))
      array.DM[i].image_url = this.users.get(id).get('image_url')
      array.DM[i].anagram = this.users.get(id).get('anagram')
      array.DM[i].nickname = this.users.get(id).get('nickname')
    }

    // header center
    const currentChannel = this.channels.at(0)
    if (currentChannel.get('privacy') === 'direct_message') {
      const id = currentChannel.get('participant_ids').find(el => el !== this.userLogged.get('id'))
      array.channel = false
      array.image_url = this.users.get(id).get('image_url')
      array.anagram.anagram = this.users.get(id).get('anagram')
      array.nickname.nickname = this.users.get(id).get('nickname')
      array.status = 'online'
      array.slide_show = './icons/slideshow.svg'
    } else {
      array.channel = true
      array.name = currentChannel.get('name')
    }

    // history messages
    array.messages = Array(30) // size of nb history messages
    for (let i = 0; i < 30; i++) {
      array.messages.push({
        anagram: '[24.c]',
        image_url: './images/profile-pic.jpg',
        nickname: 'pganglof-with-very-long-name',
        time: i,
        message: 'ptite game?'
      })
    }

    // right side
    array.privacy = 'Public'
    array.usersOnline = Array() // nb usersOnline
    array.nbOnline = '4'
    array.nbInGame = '1'
    array.nbOffline = '0'
    for (let i = 0; i < 4; i++) {
      array.usersOnline.push({
        anagram: '[txt]',
        image_url: './images/jdurand.png',
        nickname: 'jdurand123456789',
        others: true
      })
      const length = array.usersOnline[i].anagram.length + array.usersOnline[i].nickname.length
      if (length > 17) {
        const size = 16 - array.usersOnline[i].anagram.length
        array.usersOnline[i].nickname = array.usersOnline[i].nickname.substr(0, size) + '.'
      }
    }

    // in game
    array.usersInGame = Array() // nb usersOnline
    for (let i = 0; i < 1; i++) {
      array.usersInGame.push({
        anagram: '[txt]',
        image_url: './images/jdurand.png',
        nickname: 'jdurand123456789'
      })
      const length = array.usersInGame[i].anagram.length + array.usersInGame[i].nickname.length
      if (length > 17) {
        const size = 16 - array.usersInGame[i].anagram.length
        array.usersInGame[i].nickname = array.usersInGame[i].nickname.substr(0, size) + '.'
      }
    }

    // offline
    array.usersOffline = Array() // nb usersOnline
    for (let i = 0; i < 1; i++) {
      array.usersOffline.push({
        anagram: '[txt]',
        image_url: './images/jdurand.png',
        nickname: 'jdurand123456789'
      })
      const length = array.usersOffline[i].anagram.length + array.usersOffline[i].nickname.length
      if (length > 17) {
        const size = 16 - array.usersOffline[i].anagram.length
        array.usersOffline[i].nickname = array.usersOffline[i].nickname.substr(0, size) + '.'
      }
    }

    this.context = array
    const templateDataChat = this.templateChat(this.context)
    this.$el.html(templateDataChat)

    if (this.myChannels.length > 0) {
      const id = currentChannel.get('id')
      document.getElementById('channel' + id).classList.add('open')
    }
    return this
  },

  selectCheckbox: function (e) {
    const id = e.currentTarget.getAttribute('for')
    const checkbox = document.getElementById(id)
    if (checkbox.checked === true) { checkbox.checked = false } else { checkbox.checked = true }
  },

  openModalCreateChannel: function () {
    this.context.friends = JSON.parse(JSON.stringify(this.users))
    this.updateHTML('modalCreateChannel')
    document.getElementById('modalCreateChannel').style.display = 'flex'
  },

  modalClose: function () {
    const checkboxes = document.getElementsByClassName('checkbox')
    for (const el of checkboxes) {
      el.checked = false
    }
    document.getElementById('error-message').style.display = 'none'
    Array.prototype.forEach.call(document.getElementsByClassName('modal'),
      function (el) {
        el.style.display = 'none'
      })
  },

  createChannel: function () {
    const checkboxes = document.getElementsByClassName('checkbox')
    const selectedCboxes = Array.prototype.slice.call(checkboxes).filter(ch => ch.checked === true)
    const participantsIds = Array.from(selectedCboxes, x => x.value)
    const adminIds = [this.userLogged.id]
    const name = document.getElementById('channelName').value
    const newChannel = new ChatModel()
    const createChannel = async () => {
      try {
        const response = await newChannel.createChannel(name, participantsIds, 'public')
        this.myChannels.add(newChannel)
        this.channels.add(newChannel)
        this.modalClose()
        // this.render()
      } catch (error) {
        document.getElementById('error-message').innerHTML = error.responseJSON.message
        document.getElementById('error-message').style.display = 'block'
      }
    }
    createChannel()
  },

  sendMessage: function (e) {
    if (e.keyCode === 13) { console.log('send message') } else { console.log('not enter') }
  },

  updateHTML: function (div) {
    const html = this.templateChat(this.context)
    const found = $(html).find('#' + div)[0].innerHTML
    const currentDiv = document.getElementById(div)
    currentDiv.innerHTML = found
  },

  modalSearchFriends: function (e) {
    const value = document.getElementById(e.currentTarget.getAttribute('id')).value
    const search = this.users.slice().filter(function (el) {
      if (el.get('nickname').toLowerCase().startsWith(value.toLowerCase()) === true) { return true }
      if (el.get('anagram') !== undefined && el.get('anagram').toLowerCase().startsWith(value.toLowerCase()) === true) { return true }
      return false
    })
    const find = 'friends' + e.currentTarget.getAttribute('id')
    this.context.friends = JSON.parse(JSON.stringify(search))
    this.updateHTML(find)
  },

  inputModalSearchAllChannels: function (e) {
    const value = document.getElementById(e.currentTarget.getAttribute('id')).value
    const search = this.channels.slice().filter(function (el) {
      if ((el.get('privacy') === 'public' || el.get('privacy') === 'protected') &&
      el.get('name').toLowerCase().startsWith(value.toLowerCase()) === true) { return true }
      return false
    })
    this.context.channels = JSON.parse(JSON.stringify(search))
    this.updateHTML('searchAllChannel')
  },

  openModalCreateDM: function () {
    this.context.friends = JSON.parse(JSON.stringify(this.users))
    this.updateHTML('modalCreateDirectMessages')
    document.getElementById('modalCreateDirectMessages').style.display = 'flex'
  },

  createDM: function (e) {
    const id = e.currentTarget.getAttribute('for')
    console.log(id)
    const DM = this.myChannels.slice().filter(el => el.get('privacy') === 'direct_message')
    let i = 0
    for (; i < DM.length; i++) {
      if (DM[i].get('participant_ids').find(function (el) {
        if (el == id) { return true }
        return false
      })) {
        this.modalClose()
        Array.prototype.forEach.call(document.getElementsByClassName('open'),
          function (el) {
            el.classList.remove('open')
          })
        document.getElementById('DM' + DM[i].get('id')).classList.add('open')
        this.modalClose()
        break
      }
    }
    if (i === DM.length) {
      const newChannel = new ChatModel()
      const participantsIds = new Array()
      participantsIds.push(id)
      const createChannel = async () => {
        try {
          const response = await newChannel.createChannel(undefined, participantsIds, 'direct_message')
          this.myChannels.add(newChannel)
          this.context.DM.push(JSON.parse(JSON.stringify(newChannel)))
          this.context.DM[this.context.DM.length - 1].image_url = this.users.get(id).get('image_url')
          this.context.DM[this.context.DM.length - 1].anagram = this.users.get(id).get('anagram')
          this.context.DM[this.context.DM.length - 1].nickname = this.users.get(id).get('nickname')
          this.updateHTML('DM')
          this.modalClose()
          document.getElementById('DM' + newChannel.get('id')).classList.add('open')
        } catch (error) {
          console.log(error.responseJSON.message)
          this.modalClose()
        }
      }
      createChannel()
    }
  },

  deleteChannel: function () {
    const id = document.getElementById('modalValidationDeleteChannel').getAttribute('for')
    this.myChannels.get(id).leaveRoom()
    this.myChannels.remove(id)
    const disc = document.getElementById('channel' + id)
    disc.remove()
    document.getElementById('modalValidationDeleteChannel').style.display = 'none'
    document.getElementById('modalValidationDeleteChannel').setAttribute('for', '')
  },

  deleteChannelConfirmation: function (e) {
    const id = e.currentTarget.getAttribute('for')
    if (this.myChannels.get(id).get('privacy') !== 'direct_message') {
      if (this.myChannels.get(id).get('admin_ids').find(el => el === this.userLogged.get('id'))) {
        document.getElementById('modalValidationDeleteChannel').style.display = 'flex'
        document.getElementById('modalValidationDeleteChannel').setAttribute('for', id)
      } else {
        this.myChannels.get(id).leaveRoom()
        this.myChannels.remove(id)
        const disc = document.getElementById('channel' + id)
        disc.remove()
      }
    }
  },

  openModalSearchChannel: function () {
    const channels = this.channels.slice().filter(function (el) {
      if (el.get('privacy') === 'public' || el.get('privacy') === 'protected') {
        return true
      }
      return false
    })
    this.context.channels = JSON.parse(JSON.stringify(channels))
    this.updateHTML('searchAllChannel')
    document.getElementById('modalSearchAllChannels').style.display = 'flex'
  },

  subscribeChannel: function (e) {
    const id = e.currentTarget.getAttribute('for')
    const channel = this.channels.get(id)
    channel.subscribeChannel()
    this.myChannels.add(channel)
    this.modalClose()
    this.render()
  }
})