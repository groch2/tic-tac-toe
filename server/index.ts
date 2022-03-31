import bodyParser from 'body-parser'
import cors from 'cors'
import express from 'express'
import { GameEngine as Game, Player } from '../game-engine/game-engine'
import { NextPlayerGameEvent } from './next-player-game-event'
import { PlayGameRequest } from './play-game-request'
import websockets from './websockets'

const app = express()
app.use(bodyParser.json())
app.use(
  cors({
    origin: 'http://localhost:8080',
  })
)

const port = 3000
const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})

const ongoingGames: Map<string, Game> = new Map()
const websocketsServer = websockets(server, ongoingGames)

interface CreateGameRequest {
  'game-name': string
}

app.post('/create-game', (req, res) => {
  const { 'game-name': gameName }: CreateGameRequest = req.body
  ongoingGames.set(gameName, new Game(gameName))
  console.log(ongoingGames.get(gameName))
  websocketsServer.emit('new-game-created', { 'game-name': gameName })
  res.send(ongoingGames.get(gameName))
})

app.post('/play-game', (req, res) => {
  const {
    'game-name': gameName,
    'player-name': playerName,
    'cell-index': cellIndex,
  }: PlayGameRequest = req.body
  const game = ongoingGames.get(gameName)
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
    websocketsServer.emit('next-player-game-event', nextPlayerGameEvent)
  }
  res.sendStatus(200)
})

app.get('/ongoing-games', (_, res) => {
  const response = {
    'nb-games': ongoingGames.size,
    'ongoing-games': [...ongoingGames.values()].map((game) =>
      JSON.stringify(game)
    ),
  }
  res.json(response)
})
