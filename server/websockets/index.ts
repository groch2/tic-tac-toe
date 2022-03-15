import http from 'http'
import WebSocket from 'ws'
import queryString from 'query-string'

const aCodePoint = <number>'A'.codePointAt(0)
const getRandomWord = (length: number) =>
  new Array(length)
    .fill(0)
    .map(() => String.fromCharCode(Math.floor(Math.random() * 26) + aCodePoint))
    .join('')

export default (expressServer: http.Server) => {
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
        const connectionParams = queryString.parse(params)

        // NOTE: connectParams are not used here but good to understand how to get
        // to them if you need to pass data with the connection to identify it (e.g., a userId).
        console.log(connectionParams)
      }

      websocketConnection.on('message', (message) => {
        const parsedMessage = JSON.parse(`${message}`)
        console.log(parsedMessage)
        const responseMessage = JSON.stringify({
          message: getRandomWord(10),
        })
        console.log({ nbClients: websocketServer.clients.size })
        console.log({ nbConnectedClients })
        websocketServer.clients.forEach((c) => {
          c.send(responseMessage)
        })
      })
      websocketConnection.on('close', function (this, code, reason) {
        nbConnectedClients -= (() => {
          switch (this.readyState) {
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
          `closing connection: ${code}, reason: ${textReason}, state: ${this.readyState}`
        )
      })
    }
  )

  return websocketServer
}
