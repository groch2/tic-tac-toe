import type { Player } from '../../../game-engine/game-engine'

export interface JoinGameEvent {
  'game-name': string
  'player-name': string
  'player-position': Player
}
