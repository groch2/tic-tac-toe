import { Player } from '../game-engine/game-engine'

export interface NextPlayerGameEvent {
  'game-name': string
  'next-player': Player
}
