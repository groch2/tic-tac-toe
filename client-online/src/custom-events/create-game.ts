import type { PlayerPosition } from '../../../game-engine/game-engine'

export interface CreateGameEvent {
  'game-initiator-player-name': string
  'game-initiator-player-position': PlayerPosition
}
