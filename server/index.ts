import express from 'express'
import websockets from './websockets'
import bodyParser from 'body-parser'
import { GameEngine as Game, Player } from '../game-engine/game-engine'
import { PlayGameRequest } from './play-game-request'
import { NextPlayerGameEvent } from './next-player-game-event'

const app = express()
app.use(bodyParser.json())

const port = 3000
const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})

const ongoingGames: Map<string, Game> = new Map()
const websocketsServer = websockets(server)

interface CreateGameRequest {
  'player-O-name': string
  'player-X-name': string
  'game-name': string
}

app.post('/create-game', (req, res) => {
  const {
    'game-name': gameName,
    'player-O-name': playerO_Name,
    'player-X-name': playerX_Name,
  }: CreateGameRequest = req.body
  ongoingGames.set(gameName, new Game(gameName, playerO_Name, playerX_Name))
  console.log(ongoingGames.get(gameName))
  res.send(ongoingGames.get(gameName))
})

app.post('/play-game', (req, res) => {
  const {
    'game-name': gameName,
    'player-name': playerName,
    'cell-index': cellIndex,
  }: PlayGameRequest = req.body
  const game = ongoingGames.get(gameName)
  if (!game) {
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
    const nextPlayerGameEvent: NextPlayerGameEvent = {
      'game-name': gameName,
      'next-player': game.currentPlayer,
    }
    websocketsServer.emit('next-player-game-event', nextPlayerGameEvent)
  }
  res.sendStatus(200)
})

app.get('/ongoing-games', (_, res) => {
  res.json(Object.values(ongoingGames).map((game) => JSON.stringify(game)))
})
