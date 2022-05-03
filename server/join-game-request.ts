import { PlayerPosition } from '../game-engine/game-engine'

export type JoinGameRequest = {
  'game-initiator-player-name': string
  'joining-player-name': string
  'joining-player-position': PlayerPosition
}
