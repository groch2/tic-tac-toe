import express from 'express'
import websockets from './websockets'
import bodyParser from 'body-parser'

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

app.post('/create-game', (req, res) => {
  const createGameRequest: { 'game-creator-name': string } = req.body
  console.log({ 'game-creator-name': createGameRequest['game-creator-name'] })
  res.send('coucou')
})
