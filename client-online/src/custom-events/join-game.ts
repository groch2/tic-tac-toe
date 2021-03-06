import type { PlayerPosition } from '../../../game-engine/game-engine'

export interface JoinGameEvent {
  'game-initiator-player-name': string
  'joining-player-name': string
  'joining-player-position': PlayerPosition
}
