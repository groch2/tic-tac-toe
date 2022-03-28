import http from 'http'
import queryString from 'query-string'
import WebSocket from 'ws'
import { Player } from '../../game-engine/game-engine'
import { NextPlayerGameEvent } from '../next-player-game-event'

let connectionsByGameName: Map<string, WebSocket.WebSocket[]>

export default (expressServer: http.Server) => {
  connectionsByGameName = new Map()
  const websocketServer = new WebSocket.Server({
    noServer: true,
    path: '/websockets',
  })
  expressServer.on('upgrade', (request, socket, head) => {
    websocketServer.handleUpgrade(request, socket, head, (websocket) => {
      websocketServer.emit('connection', websocket, request)
    })
  })
  let nbConnectedClients = 0
  websocketServer.on(
    'connection',
    function connection(websocketConnection, connectionRequest) {
      nbConnectedClients +=
        websocketConnection.readyState === WebSocket.OPEN ? 1 : 0
      console.log({ nbConnectedClients })
      const queryStringParameters = connectionRequest?.url?.split('?')
      if (queryStringParameters) {
        const [_, params] = queryStringParameters
        const { 'game-name': gameName } = queryString.parse(params) as {
          'game-name': string
        }
        if (!connectionsByGameName.has(gameName)) {
          connectionsByGameName.set(gameName, new Array<WebSocket.WebSocket>())
        }
        const gameConnections = connectionsByGameName.get(
          gameName
        ) as WebSocket.WebSocket[]
        if (gameConnections.length == 2) {
          throw new Error(`the game: "${gameName}" already has 2 players`)
        }
        gameConnections.push(websocketConnection)
      }
      websocketConnection.on('close', (code, reason) => {
        nbConnectedClients -= (() => {
          switch (websocketConnection.readyState) {
            case WebSocket.CLOSING:
            case WebSocket.CLOSED:
              return 1
            default:
              return 0
          }
        })()
        console.log({ nbConnectedClients })
        console.log({ reasonLength: reason.length })
        const textReason = reason.toString('utf-8')
        console.log(
          `closing connection: ${code}, reason: ${textReason}, state: ${websocketConnection.readyState}`
        )
      })
    }
  )
  websocketServer.on(
    'next-player-game-event',
    (nextPlayerGameEvent: NextPlayerGameEvent) => {
      const { 'game-name': gameName, 'next-player': nextPlayer } =
        nextPlayerGameEvent
      if (!connectionsByGameName.has(gameName)) {
        throw new Error(`The game named: "${gameName}" cannot be found.`)
      }
      const gameConnections = connectionsByGameName.get(
        gameName
      ) as WebSocket.WebSocket[]
      gameConnections[nextPlayer === Player.O ? 0 : 1].send(
        JSON.stringify({ message: "it's your turn" })
      )
    }
  )
  return websocketServer
}
