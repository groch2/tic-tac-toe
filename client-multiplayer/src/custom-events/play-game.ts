import type { PlayGameEvent } from '../../../server/play-game-event'

export const getPlayGameEvent = ({
  'game-name': gameName,
  'next-player': nextPlayer,
  'last-move-cell': lastMoveCell,
  'last-move-coordinates': lastMovecoordinates,
}: PlayGameEvent) =>
  new CustomEvent('play-game', {
    detail: {
      'game-name': gameName,
      'next-player': nextPlayer,
      'last-move-cell': lastMoveCell,
      'last-move-coordinates': lastMovecoordinates,
    },
  })
