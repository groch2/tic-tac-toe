import http from 'http'
import queryString from 'query-string'
import WebSocket from 'ws'
import { GameEngine as Game } from '../../game-engine'
import { Player } from '../../game-engine/game-engine'
import { JoinGameRequest } from '../../server/join-game-request'
import { NextPlayerGameEvent } from '../next-player-game-event'

let connectionsByPlayerName: Map<string, WebSocket.WebSocket>
let connectionsByGameName: Map<string, WebSocket.WebSocket[]>
export default (
  expressServer: http.Server,
  gamesByGameName: Map<string, Game>
) => {
  connectionsByPlayerName = new Map()
  connectionsByGameName = new Map()
  const websocketServer = new WebSocket.Server({
    noServer: true,
    path: '/websockets',
  })
  console.log(
    `websocket server is running: ${JSON.stringify(websocketServer.options)}`
  )
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
        const { 'player-name': playerName } = queryString.parse(params) as {
          'player-name': string
        }
        if (connectionsByPlayerName.has(playerName)) {
          throw new Error(`the player name: "${playerName} is already taken`)
        }
        connectionsByPlayerName.set(playerName, websocketConnection)
        websocketConnection.send(`welcome player ${playerName}`)
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
    'join-game',
    ({ 'game-name': gameName, 'player-name': playerName }: JoinGameRequest) => {
      const game = gamesByGameName.get(gameName)
      if (game === undefined) {
        throw new Error(`the game: "${gameName}" does not exists`)
      }
      const playerConnection = connectionsByPlayerName.get(playerName)
      if (playerConnection === undefined) {
        throw new Error(`the player: "${playerName}" is not connected`)
      }
      let newPlayer: Player | undefined
      if (game.playerO_Name === undefined) {
        game.playerO_Name = playerName
        newPlayer = Player.O
      } else if (game.playerX_Name === undefined) {
        game.playerX_Name = playerName
        newPlayer = Player.X
      } else {
        throw new Error(
          `the game: "${gameName} already has 2 registered players`
        )
      }
      if (!connectionsByGameName.has(gameName)) {
        connectionsByGameName.set(gameName, new Array<WebSocket.WebSocket>())
      }
      const gameConnections = connectionsByGameName.get(
        gameName
      ) as WebSocket.WebSocket[]
      if (gameConnections.length == 2) {
        throw new Error(`the game: "${gameName}" already has 2 players.`)
      }
      gameConnections.push(playerConnection)
      playerConnection.send(
        `welcome in game: "${gameName}", you are player: "${newPlayer}"`
      )
    }
  )
  websocketServer.on('new-game-created', (newGame: { 'game-name': string }) => {
    websocketServer.clients.forEach((c) =>
      c.send(JSON.stringify({ 'event-type': 'new-game-created', ...newGame }))
    )
  })
  websocketServer.on(
    'next-player-game-event',
    (nextPlayerGameEvent: NextPlayerGameEvent) => {
      const {
        'game-name': gameName,
        'next-player': nextPlayer,
        'last-move-cell': cellOccupied,
        'last-move-coordinates': coordinatesOccupied,
      } = nextPlayerGameEvent
      const gameConnections = connectionsByGameName.get(gameName)
      if (gameConnections === undefined) {
        throw new Error(`The game named: "${gameName}" cannot be found`)
      }
      gameConnections[nextPlayer === Player.O ? 0 : 1].send(
        JSON.stringify({
          message: `player ${nextPlayer}, it's your turn. last move: ${coordinatesOccupied} (cell: ${cellOccupied})`,
        })
      )
    }
  )
  return websocketServer
}
