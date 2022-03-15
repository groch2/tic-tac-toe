import express from 'express'
import websockets from './websockets'

const app = express()
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
