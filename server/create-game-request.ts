import { PlayerPosition } from '../game-engine/game-engine'

export type CreateGameRequest = {
  'initiator-player-name': string
  'initiator-player-position': PlayerPosition
}
