import type { Player } from '../game-engine/game-engine'

export interface PlayGameEvent {
  'game-name': string
  'next-player': Player
  'last-move-cell': number
  'last-move-coordinates': string
}
