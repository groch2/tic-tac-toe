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
  'game-creator-name': string
  'game-name': string
}

const ongoingGames: Game[] = []

app.post('/create-game', (req, res) => {
  const {
    'game-creator-name': gameCreatorName,
    'game-name': gameName,
  }: CreateGameRequest = req.body
  const game = { gameCreatorName, gameName }
  ongoingGames.push(new Game(gameName))
  console.log(game)
  res.send(game)
})

app.get('/ongoing-games', (_, res) => {
  res.json(ongoingGames)
})
