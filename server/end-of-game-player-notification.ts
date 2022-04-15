import { PlayerEndOfGameStatus } from './player-end-of-game-status'

export interface EndOfGamePlayerNotification {
  'player-end of-game-status': PlayerEndOfGameStatus
  'is-end-of-game-by-forfeit': boolean
}
