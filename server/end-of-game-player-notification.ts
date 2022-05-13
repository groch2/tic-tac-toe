import { PlayerEndOfGameStatus } from './player-end-of-game-status'

export interface EndOfGamePlayerNotification {
  'player-end of-game-status': PlayerEndOfGameStatus
  'is-end-of-game-by-forfeit': boolean
  'last-cell-index-played': number | null
  'is-draw-game': boolean
}
