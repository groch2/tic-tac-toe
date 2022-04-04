import { Player } from '../game-engine/game-engine'

export type CreateGameRequest = {
  'game-name': string
  'player-name': string
  'player-position': Player
}
