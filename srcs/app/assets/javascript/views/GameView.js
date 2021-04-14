const WIDTH = 512
const HEIGHT = 256
const MIDDLEX = WIDTH / 2
const MIDDLEY = HEIGHT / 2
const PLAYER_SIZE_X = 2
const PLAYER_SIZE_Y = 28

export const GameView = Backbone.View.extend({
  /* events: {
    // For test archi only
    'click #gameWindow': function (e) {
      this.receiveMessage({
        ball: {
          x: 150,
          y: 45,
          dir: 12
        },
        player_left: { pos: 25 },
        player_right: { pos: 12 }
      })
    }
  }, */
  el: $('#app'),
  initialize: function (options) {
    this.users = this.model.get('users').get('obj')
    this.id = this.model.get('userLoggedId')
    // this.opponentId = options.opponentId
    this.guilds = this.model.get('guilds').get('obj')
    this.socket = options.socket
    this.gameId = options.gameId
    this.games = this.model.get('gameRecords').get('obj')
    console.log(this.opponentId)
    this.loadModels()
  },

  loadModels: function () {
    const load = async () => {
      try {
        await this.users.fetch() &&
				// await this.guilds.fetch() &&
				await this.games.fetch()
        this.loadDocument()
        this.user = this.users.get(this.id)
        if (this.gameId === undefined || this.gameId === '' || this.gameId === null) {
          // $(document).ready(this.playLadder())
          $(document).ready(this.challengeAlfred())
        } else {
          this.game = this.games.get(this.gameId)
          // gérer game not found
          this.mode = this.game.get('mode')
          if (this.mode === 'duel') {
            $(document).ready(this.playDuel())
          } else if (this.mode === 'war') {
            $(document).ready(this.playWar())
          }
        }
      //   this.opponent = this.users.get(this.opponentId)
      } catch (e) {
        console.log('Error while fetching models')
        console.log(e)
      }
    }
    load()
  },

  loadDocument: function () {
    if (this.game) {
      this.$el.html(Handlebars.templates.game({ mode: this.game.get('mode') }))
    } else {
    	this.$el.html(Handlebars.templates.game({ mode: 'ladder' }))
    }
  },

  callmatchmaking: function (f) {
    return $.ajax({
      url: '/api/games/',
      data: { mode: 'ladder', opponent_id: '5' },
      method: 'POST',
      success: f
    })
  },

  setLadderGame: function (response) {
    console.log('In setLadderGame')
    console.log(response)
    this.game = response
  },

  playLadder: function () {
    console.log('bonjour ladder')
    // lancer matchMaking
    const loadMatchMaking = async () => {
      // afficher Waiting
      try {
      	await this.callmatchmaking(this.setLadderGame)
      } catch (e) {
        console.log('error while requesting ladder match')
        console.log(e)
        // this.initializeGame()
      }
    }
    loadMatchMaking()
  },

  playDuel: function () {
    console.log('bonjour duel')
  },

  playWar: function () {
    console.log('bonjour war')
  },

  initializeGame: function () {
    this.canvas = document.getElementById('gameWindow')
    console.log(this.game)
    console.log(this.game.player_left_id)
   	this.data = [{
      canvas: this.canvas,
      canvasLocation: undefined,
      ctx: undefined,
      playerLeft: {
	      nickname: this.users.get(this.game.player_left_id).get('nickname'),
	      // nickname: 'left',
		 		score: 0,
	      isUser: false,
	      x: WIDTH / 10,
	      y: HEIGHT / 2 - PLAYER_SIZE_Y / 2
	    },
      playerRight: {
	      nickname: this.users.get(this.game.player_right_id).get('nickname'),
	      // nickname: 'right',
		 		score: 0,
	      isUser: false,
	      x: WIDTH - WIDTH / 10,
	      y: HEIGHT / 2 - PLAYER_SIZE_Y / 2
	    },
      ball: {
	      x: WIDTH / 2,
	      y: HEIGHT / 2,
	      r: 5,
        dir: 0
	    },
      socket: this.socket,
      end: false,
      gameId: this.gameId,
      receiveMessage: undefined
    }]
    this.data[0].canvasLocation = this.data[0].canvas.getBoundingClientRect()
    this.data[0].ctx = this.data[0].canvas.getContext('2d')
    // this.data[0].ctx.witdh = WIDTH
    // this.data[0].ctx.height = HEIGHT
    // if (this.game.get('player_left_id') === this.id) {
	  this.data[0].playerLeft.isUser = true
    printField(this.data[0])
    printTextBoxes(this.data[0])
    printPaddles(this.data[0])
    printBall(this.data[0])
	  /* } else if (this.game.get('player_right_id') === this.id) {
	  this.playerRight.isUser = true
	  } */
    const data = this.data[0]
    this.data[0].canvas.addEventListener('mousemove', function (e) { move(e, data) })
    // join websocket and it's set the receiveMessage method
    // data[0].socket.subscribeChannel(data.gameId, 'GameChannel')
    // data[0].socket.updateContext(this, undefined)
    preGameLoop(this.data)
  },

  receiveMessage: function (msg) {
    // ici on update les data de jeu
    console.log(msg)
    if (msg.player_left) {
      this.data[0].playerLeft.y = msg.player_left.pos
    }
    if (msg.player_right) {
      this.data[0].playerRight.y = msg.player_right.pos
    }
    if (msg.ball) {
      this.data[0].ball.x = msg.ball.x
      this.data[0].ball.y = msg.ball.y
      this.data[0].ball.dir = msg.ball.dir
    }
    if (msg.action && msg.action === 'game_joined') {
      console.log('game joined')
      this.gameId = msg.id
    }
    if (msg.game_won) {
      // this.data[0].socket.close()
      // afficher écran victoire
      // this.data[0].end = true
    } else if (msg.game_lost) {
      // this.data[0].socket.close()
      // afficher écran défaite
      // this.data[0].end = true
    }
    // this.data[0].ball.x += 10
    // this.data[0].playerRight.y -= 10
  },

  callAlfred: async function () {
    return await $.ajax({
      url: '/api/games/',
      data: { mode: 'duel', opponent_id: '1' },
      method: 'POST',
      context: this,
      success: function (response) {
        console.log(response)
        this.game = response
        this.initializeGame()
      }
    })
  },

  challengeAlfred: function () {
    // const load = async () => {
    try {
      	this.callAlfred()
      /* console.log('la')
      console.log(this.game) */
    } catch (e) {
      console.log('error while trying to challengeAlfred')
      console.log(e)
    }
    // }
    // load()
  }
})

function printField (data) {
  data.ctx.fillStyle = 'black'
  data.ctx.fillRect(0, 0, WIDTH, HEIGHT)
  data.ctx.strokeStyle = 'white'
  data.ctx.beginPath()
  data.ctx.moveTo(WIDTH / 2, 0)
  data.ctx.lineTo(WIDTH / 2, HEIGHT)
  data.ctx.stroke()
  data.ctx.closePath()
}

function printPaddles (data) {
  data.ctx.strokeStyle = 'white'
  data.ctx.fillStyle = 'white'
  data.ctx.fillRect(data.playerLeft.x, data.playerLeft.y, PLAYER_SIZE_X, PLAYER_SIZE_Y)
  data.ctx.fillRect(data.playerRight.x, data.playerRight.y, PLAYER_SIZE_X, PLAYER_SIZE_Y)
}

function printBall (data) {
  data.ctx.beginPath()
  data.ctx.strokeStyle = 'yellow'
  data.ctx.fillStyle = 'yellow'
  data.ctx.arc(data.ball.x, data.ball.y, data.ball.r, 0, Math.PI * 2, true)
  data.ctx.stroke()
  data.ctx.fill()
  data.ctx.closePath()
}

function printTextBoxes (data) {
  const px_height = 15
  data.ctx.fillStyle = 'white'
  data.ctx.font = px_height + 'px serif'
  data.ctx.textAlign = 'left'
  data.ctx.textBaseline = 'top'

  let boxes_text = data.playerLeft.nickname
  // penser a réduire si le nom est trop grand
  data.ctx.fillText(boxes_text, 0, 0)
  boxes_text = data.playerLeft.score
  data.ctx.fillText(boxes_text, 0, px_height + 5)

  boxes_text = data.playerRight.nickname
  data.ctx.fillText(boxes_text, WIDTH - (data.ctx.measureText(boxes_text).width), 0)
  boxes_text = data.playerRight.score
  data.ctx.fillText(boxes_text, WIDTH - (data.ctx.measureText(boxes_text).width), px_height + 5)
}

function move (e, data) {
  const canvasLocation = data.canvasLocation
  const mouseLocation = event.clientY - canvasLocation.y
  // console.log(mouseLocation)
  if (data.playerLeft.isUser) {
  	data.playerLeft.y = mouseLocation - PLAYER_SIZE_Y / 2
  } else if (data.playerRight.isUser) {
    data.playerRight.y = mouseLocation - PLAYER_SIZE_Y / 2
  }
  /*
	data.socket.send(JSON.stringify({move: {pos: mouseLocation}})
	*/
}

function updateGameState (data) {
  // do stuff with websocket to update positions
  // console.log(data.socket)
  // data.socket.receiveMessage() -> update pos in if forrest
  // data.ball.x += 10
}

function gameLoop (data) {
  let animation
  /* $(window).bind('unload', function () {
    console.log('NONONO')
  }) */
  printField(data[0])
  printTextBoxes(data[0])
  printPaddles(data[0])
  printBall(data[0])
  console.log(1)
  if (!data[0].end) {
  	animation = window.requestAnimationFrame(function () { gameLoop(data) })
  } else {
    data[0].canvas.removeEventListener('mousemove', function (e) { move(e, data[0]) }) // ca marche???
    // data[0].socket.close()
  }
}

function preGameLoop (data) {
  /* Suscribe to start playing
	get invitation
	data[0].socket.subscribeChannel(roomId ????, 'GameChannel')
	data[0].socket.subscribeChannel(data.gameId, 'GameChannel')
	data[0]

	*/
  gameLoop(data)
  console.log(data[0].socket)
}
