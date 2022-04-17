import type { Player } from '../../../game-engine/game-engine'

export interface CreateGameEvent {
  'initiator-player-name': string
  'initiator-player-position': Player
}
