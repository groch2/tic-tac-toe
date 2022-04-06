import type { GameBeginningEvent } from '../../../server/game-beginning-event'

export const getGameBeginningEvent = ({
  'game-name': gameName,
  'opponent-player-name': opponentPlayerName,
}: GameBeginningEvent) =>
  new CustomEvent('game-beginning', {
    detail: {
      'game-name': gameName,
      'opponent-player-name': opponentPlayerName,
    },
  })
