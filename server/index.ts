import express from 'express'
import websockets from './websockets'
import bodyParser from 'body-parser'
import { GameEngine as Game } from '../game-engine/game-engine'

const app = express()
app.use(bodyParser.json())

const port = 3000
const server = app.listen(port, () => {
  console.log("c'est parti")
  if (process.send) {
    process.send(`Server running at http://localhost:${port}\n\n`)
  }
})

websockets(server)

process.on('message', (message) => {
  console.log(message)
})

interface CreateGameRequest {
  'player-O-name': string
  'player-X-name': string
  'game-name': string
}

interface PlayGameRequest {
  'game-name': string
  'player-name': string
  'cell-index': string
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
  const {
    'game-name': gameName,
    'player-name': playerName,
    'cell-index': cellIndex,
  }: PlayGameRequest = req.body
  const game = ongoingGames[gameName]
})

app.get('/ongoing-games', (_, res) => {
  res.json(Object.values(ongoingGames).map((game) => JSON.stringify(game)))
})
