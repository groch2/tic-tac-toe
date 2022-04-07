import type { Player } from '../game-engine/game-engine'

export interface PlayGameEvent {
  'previous-player': Player
  'cell-index-played': number
}
