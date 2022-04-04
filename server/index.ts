import bodyParser from 'body-parser'
import cors from 'cors'
import express from 'express'
import { GameEngine as Game, Player } from '../game-engine/game-engine'
import { NextPlayerGameEvent } from './next-player-game-event'
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

interface CreateGameRequest {
  'game-name': string
  'player-name': string
  'player-position': Player
}

function createGame(request: express.Request, response: express.Response) {
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
  } = request.body as CreateGameRequest
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
}
app.post('/create-game', createGame)

function joinGame(request: express.Request, response: express.Response) {
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
}
app.post('/create-game', joinGame)

app.post('/play-game', (req, res) => {
  const {
    'game-name': gameName,
    'player-name': playerName,
    'cell-index': cellIndex,
  }: PlayGameRequest = req.body
  const game = ongoingGamesByGameName.get(gameName)
  if (game === undefined) {
    res.status(404).send(`The game named: "${gameName}" cannot be found.`)
    return
  }
  if (game.isGameOver) {
    res.status(400).send(`The game: "${gameName}" is over`)
    return
  }
  if (
    (game.currentPlayer === Player.O && game.playerO_Name !== playerName) ||
    (game.currentPlayer === Player.X && game.playerX_Name !== playerName)
  ) {
    res.status(400).send(`Wrong player: "${playerName}"`)
    return
  }
  if (game.isCellOccupied(cellIndex)) {
    res.status(400).send(`Position already occupied: "${cellIndex}"`)
    return
  }
  game.play(cellIndex)
  if (!game.isGameOver) {
    const row = Math.floor(cellIndex / 3)
    const column = cellIndex - row * 3
    const nextPlayerGameEvent: NextPlayerGameEvent = {
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
    nextPlayerConnection.write(
      `data: ${JSON.stringify(nextPlayerGameEvent)}\n\n`
    )
  }
  res.sendStatus(200)
})

app.get('/ongoing-games', (_, res) => {
  const response = {
    'nb-games': ongoingGamesByGameName.size,
    'ongoing-games': [...ongoingGamesByGameName.values()].map((game) =>
      JSON.stringify(game)
    ),
  }
  res.json(response)
})

app.get('/pending-games', (_, res) => {
  res.json({
    'nb-games': pendingGamesNames.size,
    'pending-games': [...pendingGamesNames].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    ),
  })
})
