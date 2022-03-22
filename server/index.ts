import express from 'express'
import websockets from './websockets'
import bodyParser from 'body-parser'
import { GameEngine as Game, Player } from '../game-engine/game-engine'
import { PlayGameRequest } from './play-game-request'

const app = express()
app.use(bodyParser.json())

const port = 3000
const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})

const websocketsServer = websockets(server)

process.on('message', (message) => {
  console.log(message)
})

interface CreateGameRequest {
  'player-O-name': string
  'player-X-name': string
  'game-name': string
}

const ongoingGames: { [gameName: string]: Game } = {}

app.post('/create-game', (req, res) => {
  const {
    'game-name': gameName,
    'player-O-name': playerO_Name,
    'player-X-name': playerX_Name,
  }: CreateGameRequest = req.body
  ongoingGames[gameName] = new Game(gameName, playerO_Name, playerX_Name)
  console.log(ongoingGames[gameName])
  res.send(ongoingGames[gameName])
})

app.post('/play-game', (req, res) => {
  const request: PlayGameRequest = req.body
  const {
    'game-name': gameName,
    'player-name': playerName,
    'cell-index': cellIndex,
  }: PlayGameRequest = request
  const game = ongoingGames[gameName]
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
  websocketsServer.emit('play-game', request)
  res.sendStatus(200)
})

app.get('/ongoing-games', (_, res) => {
  res.json(Object.values(ongoingGames).map((game) => JSON.stringify(game)))
})
