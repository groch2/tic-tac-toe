import type { PlayerPosition } from '../game-engine/game-engine'

export interface PlayGameEvent {
  'previous-player': PlayerPosition
  'cell-index-played': number
}
