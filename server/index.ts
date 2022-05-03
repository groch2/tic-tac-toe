import bodyParser from 'body-parser'
import cors from 'cors'
import express from 'express'
import { GameEngine as Game, Player } from '../game-engine/game-engine'
import { CreateGameRequest } from './create-game-request'
import { EndOfGamePlayerNotification } from './end-of-game-player-notification'
import { GameBeginningEvent } from './game-beginning-event'
import { JoinGameRequest } from './join-game-request'
import { PlayGameEvent } from './play-game-event'
import { PlayGameRequest } from './play-game-request'
import { PlayerEndOfGameStatus } from './player-end-of-game-status'
import { PlayerLoginRequest } from './player-login-request'
import { QuitGameRequest } from './quit-game-request'

const app = express()
app.use(bodyParser.json())
app.use(
  cors({
    origin: 'http://localhost:8080',
  })
)

const port = 3000
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})

// Games that have at lease one registered player
const gamesByGameInitiatorPlayerName: Map<string, Game> = new Map()
// Games names that have been created, and are waiting for an opponent, in order to start
const pendingGamesInitiatorPlayerName: Set<string> = new Set()
const nbActivePlayersByGameInitiatorPlayerName: Map<string, number> = new Map()
const connectionsByPlayerName: Map<string, express.Response> = new Map()

function sendEvent(
  playerConnection: express.Response,
  event: string,
  data: any
) {
  console.debug(`sending event: ${event}`)
  playerConnection.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  console.debug('event sent')
}

app.get('/player/login', (request, response) => {
  console.debug('player login request begin...')
  const { 'player-name': playerName } = request.query as PlayerLoginRequest
  const headers = {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
  }
  response.writeHead(200, headers).write(`ok\n\n`)
  connectionsByPlayerName.set(playerName, response)
  request.on('close', () => {
    console.log(`player: "${playerName}" connection closed`)
    connectionsByPlayerName.delete(playerName)
  })
  console.debug(`player: ${playerName} is connected to the server`)
})

app.post('/game/create', (request, response) => {
  const {
    'initiator-player-name': initiatorPlayerName,
    'initiator-player-position': initiatorPlayerPosition,
  } = request.body as CreateGameRequest
  console.debug(`create game request`, request.body)
  const newGame = new Game(
    initiatorPlayerName,
    initiatorPlayerPosition === Player.O ? initiatorPlayerName : undefined,
    initiatorPlayerPosition === Player.X ? initiatorPlayerName : undefined
  )
  pendingGamesInitiatorPlayerName.add(initiatorPlayerName)
  gamesByGameInitiatorPlayerName.set(initiatorPlayerName, newGame)
  nbActivePlayersByGameInitiatorPlayerName.set(initiatorPlayerName, 1)
  response.sendStatus(200).end()
  console.debug(`new game initiated by player : ${initiatorPlayerName}`)
})

app.post('/game/join', (request, response) => {
  console.debug('join game request', JSON.stringify(request.body))
  const {
    'game-initiator-player-name': gameInitiatorPlayerName,
    'joining-player-name': joiningPlayerName,
    'joining-player-position': joiningPlayerPosition,
  } = request.body as JoinGameRequest
  const game = gamesByGameInitiatorPlayerName.get(gameInitiatorPlayerName)
  if (game === undefined) {
    throw new Error(
      `the game named: "${gameInitiatorPlayerName}" does not exist`
    )
  }
  if (joiningPlayerPosition === Player.O) {
    if (game.playerO_Name !== undefined) {
      throw new Error('Player position O is already occupied')
    }
    game.playerO_Name = joiningPlayerName
  }
  if (joiningPlayerPosition === Player.X) {
    if (game.playerX_Name !== undefined) {
      throw new Error('Player position X is already occupied')
    }
    game.playerX_Name = joiningPlayerName
  }
  nbActivePlayersByGameInitiatorPlayerName.set(
    gameInitiatorPlayerName,
    (nbActivePlayersByGameInitiatorPlayerName.get(
      gameInitiatorPlayerName
    ) as number) + 1
  )
  console.debug({
    'game-initiator-player-name': gameInitiatorPlayerName,
    'nb-players': nbActivePlayersByGameInitiatorPlayerName.get(
      gameInitiatorPlayerName
    ),
  })
  if (game.isComplete) {
    console.debug(
      `the game initiated by: "${game.initiatorPlayerName}" is player complete`
    )
    pendingGamesInitiatorPlayerName.delete(game.initiatorPlayerName)
    const gameInitiatorPlayerConnection = connectionsByPlayerName.get(
      gameInitiatorPlayerName
    )
    if (gameInitiatorPlayerConnection === undefined) {
      throw new Error('the game initiator player connection has been lost')
    }
    console.debug(`game initiator player connection found`)
    sendEvent(gameInitiatorPlayerConnection, 'test', { message: 'coucou' })
    sendEvent(gameInitiatorPlayerConnection, 'game-beginning', {
      event: 'game-beginning',
      'opponent-player-name': joiningPlayerName,
    } as GameBeginningEvent)
    console.debug(
      `game begining event sent to player: "${gameInitiatorPlayerName}"`
    )
  }
  response.sendStatus(200).end()
})

app.post('/game/play', (request, response) => {
  console.log('play game request begins...')
  const {
    'game-initiator-player-name': gameInitiatorPlayerName,
    'player-name': playerName,
    'cell-index-played': cellIndex,
  } = request.body as PlayGameRequest
  console.log('play game request body:', request.body as PlayGameRequest)
  const game = gamesByGameInitiatorPlayerName.get(gameInitiatorPlayerName)
  if (game === undefined) {
    response
      .status(404)
      .send(
        `The game started by player: "${gameInitiatorPlayerName}" cannot be found.`
      )
      .end()
    return
  }
  if (game.isGameOver) {
    response
      .status(400)
      .send(`The game started by player: "${gameInitiatorPlayerName}" is over`)
      .end()
    return
  }
  if (
    (game.currentPlayer === Player.O && game.playerO_Name !== playerName) ||
    (game.currentPlayer === Player.X && game.playerX_Name !== playerName)
  ) {
    response.status(400).send(`Wrong player: "${playerName}"`).end()
    return
  }
  if (game.isCellOccupied(cellIndex)) {
    response.status(400).send(`Position already occupied: "${cellIndex}"`).end()
    return
  }
  const previousPlayer = game.currentPlayer
  game.play(cellIndex)
  const nextPlayerGameEvent: PlayGameEvent = {
    'previous-player': previousPlayer,
    'cell-index-played': cellIndex,
  }
  const nextPlayerConnection = connectionsByPlayerName.get(
    game.currentPlayerName
  )
  if (nextPlayerConnection === undefined) {
    throw new Error(
      `the connection for player: "${game.currentPlayerName}" cannot be found`
    )
  }
  sendEvent(nextPlayerConnection, 'play-game', nextPlayerGameEvent)
  response.sendStatus(200).end()
  console.debug('played:', { nextPlayerGameEvent })
})

app.post('/game/quit', (request, response) => {
  const {
    'game-initiator-player-name': gameInitiatorPlayerName,
    'quitter-player-name': quitterPlayerName,
  } = request.body as QuitGameRequest
  console.debug({ 'quit-game-request': request.body })
  const game = gamesByGameInitiatorPlayerName.get(
    gameInitiatorPlayerName
  ) as Game
  const quitterPlayerPosition = game.getPlayerPositionByName(quitterPlayerName)
  const winnerPlayerName =
    quitterPlayerPosition === Player.O ? game.playerX_Name : game.playerO_Name
  if (winnerPlayerName !== undefined) {
    const winnerConnection = connectionsByPlayerName.get(
      winnerPlayerName
    ) as express.Response
    sendEvent(winnerConnection, 'end-of-game', {
      'player-end of-game-status': PlayerEndOfGameStatus.WINNER,
      'is-end-of-game-by-forfeit': true,
    } as EndOfGamePlayerNotification)
  }
  let nbActivePlayers = nbActivePlayersByGameInitiatorPlayerName.get(
    gameInitiatorPlayerName
  ) as number
  nbActivePlayersByGameInitiatorPlayerName.set(
    gameInitiatorPlayerName,
    nbActivePlayers - 1
  )
  nbActivePlayers = nbActivePlayersByGameInitiatorPlayerName.get(
    gameInitiatorPlayerName
  ) as number
  console.log({ nbActivePlayers })
  if (nbActivePlayers === 0) {
    gamesByGameInitiatorPlayerName.delete(gameInitiatorPlayerName)
    pendingGamesInitiatorPlayerName.delete(gameInitiatorPlayerName)
  }
  response.sendStatus(200).end()
})

app.get('/games/ongoing', (_, response) => {
  response
    .json({
      'nb-games': gamesByGameInitiatorPlayerName.size,
      'ongoing-games-initiators-players-names': [
        ...gamesByGameInitiatorPlayerName.values(),
      ].map((game) => JSON.stringify(game)),
    })
    .end()
})

app.get('/games/pending', (_, response) => {
  response
    .json({
      'nb-games': pendingGamesInitiatorPlayerName.size,
      'pending-games-initiators-players-names': [
        ...pendingGamesInitiatorPlayerName,
      ].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })),
    })
    .end()
})
