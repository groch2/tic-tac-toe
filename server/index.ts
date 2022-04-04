import bodyParser from 'body-parser'
import cors from 'cors'
import express from 'express'
import { GameEngine as Game, Player } from '../game-engine/game-engine'
import { CreateGameRequest } from './create-game-request'
import { GameBeginningEvent } from './game-beginning-event'
import { PlayGameEvent } from './play-game-event'
import { PlayGameRequest } from './play-game-request'

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

const ongoingGamesByGameName: Map<string, Game> = new Map()
const connectionsByPlayerName: Map<string, express.Response> = new Map()
const pendingGamesNames: Set<string> = new Set()

function sendEvent(
  playerConnection: express.Response,
  event: string,
  data: any
) {
  playerConnection.write(`event: ${event}, data: ${JSON.stringify(data)}\n\n`)
}

app.get('/create-game', (request, response) => {
  console.debug('create game request begins')
  const headers = {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
  }
  response.writeHead(200, headers)

  const {
    'game-name': gameName,
    'player-name': playerName,
    'player-position': playerPosition,
  } = request.query as CreateGameRequest
  console.debug(`create game request`, request.query)
  const newGame = new Game(
    gameName,
    playerPosition === Player.O ? playerName : undefined,
    playerPosition === Player.X ? playerName : undefined
  )
  ongoingGamesByGameName.set(gameName, newGame)
  pendingGamesNames.add(gameName)

  const data = `data: ${JSON.stringify({
    'game-name': gameName,
    'player-position': playerPosition,
  })}\n\n`
  response.write(data)

  connectionsByPlayerName.set(playerName, response)
  request.on('close', () => {
    console.log(`${playerName} Connection closed`)
    connectionsByPlayerName.delete(playerName)
  })
})

app.post('/join-game', (request, response) => {
  const {
    'game-name': gameName,
    'player-name': playerName,
    'player-position': playerPosition,
  } = request.body as CreateGameRequest
  const game = ongoingGamesByGameName.get(gameName)
  if (game === undefined) {
    throw new Error(`the game named: "${gameName}" does not exist`)
  }
  if (playerPosition === Player.O) {
    if (game.playerO_Name !== undefined) {
      throw new Error('Player position O is already occupied')
    }
    game.playerO_Name = playerName
  }
  if (playerPosition === Player.X) {
    if (game.playerX_Name !== undefined) {
      throw new Error('Player position X is already occupied')
    }
    game.playerX_Name = playerName
  }
  if (game.isComplete) {
    pendingGamesNames.delete(game.gameName)
    const otherPlayerName = (
      playerPosition === Player.O ? game.playerX_Name : game.playerO_Name
    ) as string
    const otherPlayerConnection = connectionsByPlayerName.get(otherPlayerName)
    if (otherPlayerConnection === undefined) {
      throw new Error('the other player connection has been lost')
    }
    sendEvent(otherPlayerConnection, 'game-beginning', {
      'game-name': game.gameName,
      'opponent-player-name': playerName,
    } as GameBeginningEvent)
  }

  const headers = {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
  }
  response.writeHead(200, headers)

  const data = `data: ${JSON.stringify({
    'game-name': gameName,
    'player-position': playerPosition,
  })}\n\n`
  response.write(data)

  connectionsByPlayerName.set(playerName, response)
  request.on('close', () => {
    console.log(`${playerName} Connection closed`)
    connectionsByPlayerName.delete(playerName)
  })
})

app.post('/play-game', (request, response) => {
  const {
    'game-name': gameName,
    'player-name': playerName,
    'cell-index': cellIndex,
  }: PlayGameRequest = request.body
  const game = ongoingGamesByGameName.get(gameName)
  if (game === undefined) {
    response.status(404).send(`The game named: "${gameName}" cannot be found.`)
    return
  }
  if (game.isGameOver) {
    response.status(400).send(`The game: "${gameName}" is over`)
    return
  }
  if (
    (game.currentPlayer === Player.O && game.playerO_Name !== playerName) ||
    (game.currentPlayer === Player.X && game.playerX_Name !== playerName)
  ) {
    response.status(400).send(`Wrong player: "${playerName}"`)
    return
  }
  if (game.isCellOccupied(cellIndex)) {
    response.status(400).send(`Position already occupied: "${cellIndex}"`)
    return
  }
  game.play(cellIndex)
  if (!game.isGameOver) {
    const row = Math.floor(cellIndex / 3)
    const column = cellIndex - row * 3
    const nextPlayerGameEvent: PlayGameEvent = {
      'game-name': gameName,
      'next-player': game.currentPlayer,
      'last-move-cell': cellIndex,
      'last-move-coordinates': JSON.stringify({ row, column }),
    }
    const nextPlayerConnection = connectionsByPlayerName.get(
      game.currentPlayerName
    )
    if (nextPlayerConnection === undefined) {
      throw new Error(
        `the connection for player: "${game.currentPlayerName}" is lost`
      )
    }
    sendEvent(nextPlayerConnection, 'play-game', nextPlayerGameEvent)
  }
  response.sendStatus(200)
})

app.get('/ongoing-games', (_, response) => {
  response.json({
    'nb-games': ongoingGamesByGameName.size,
    'ongoing-games': [...ongoingGamesByGameName.values()].map((game) =>
      JSON.stringify(game)
    ),
  })
})

app.get('/pending-games', (_, response) => {
  response.json({
    'nb-games': pendingGamesNames.size,
    'pending-games': [...pendingGamesNames].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    ),
  })
})
