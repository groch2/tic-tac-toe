import { Player } from '../game-engine/game-engine'

export interface NextPlayerGameEvent {
  'game-name': string
  'next-player': Player
  'last-move-cell': number
  'last-move-coordinates': string
}
