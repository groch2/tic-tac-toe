import type { Player } from '../../../game-engine'

export interface CreateGameEvent {
  'game-name': string
  'player-name': string
  'player-position': Player
}
