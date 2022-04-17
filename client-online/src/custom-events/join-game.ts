import type { Player } from '../../../game-engine/game-engine'

export interface JoinGameEvent {
  'initiator-player-name': string
  'joining-player-name': string
  'joining-player-position': Player
}
