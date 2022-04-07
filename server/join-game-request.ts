import { Player } from '../game-engine/game-engine'

export type JoinGameRequest = {
  'game-name': string
  'player-name': string
  'player-position': Player
}
