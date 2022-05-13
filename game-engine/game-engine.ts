import { getRange } from './utils'
const forwardSlashDiagonale = getRange(2, 7, 2)
const backwardSlashDiagonale = getRange(0, 9, 4)
const columns = getRange(0, 3, 1).map((c) => getRange(c, c + 7, 3))
const rows = getRange(0, 7, 3).map((c) => getRange(c, c + 3, 1))
const allAxes: number[][] = [
  forwardSlashDiagonale,
  backwardSlashDiagonale,
  ...columns,
  ...rows,
]
export enum PlayerPosition {
  O = 'O',
  X = 'X',
}
export class GameEngine {
  private _board: (PlayerPosition | null)[]
  public get board() {
    return [...this._board]
  }
  public constructor(
    public readonly initiatorPlayerName: string,
    public playerO_Name?: string,
    public playerX_Name?: string
  ) {
    this._board = new Array(9).fill(null)
    this._currentPlayer = PlayerPosition.O
  }
  private axeValues = (axe: number[]) => axe.map((index) => this._board[index])
  private isPlayerWinning(player: PlayerPosition) {
    return allAxes.some((axe) =>
      this.axeValues(axe).every((value) => value === player)
    )
  }
  private _isPlayerO_Winning = false
  public get isPlayerO_Winning() {
    if (!this._isPlayerO_Winning) {
      this._isPlayerO_Winning = this.isPlayerWinning(PlayerPosition.O)
    }
    return this._isPlayerO_Winning
  }
  private _isPlayerX_Winning = false
  public get isPlayerX_Winning() {
    if (!this._isPlayerX_Winning) {
      this._isPlayerX_Winning = this.isPlayerWinning(PlayerPosition.O)
    }
    return this._isPlayerX_Winning
  }
  public get isDraw() {
    return (
      !this.isPlayerO_Winning &&
      !this.isPlayerX_Winning &&
      this._board.every((value) => value !== null)
    )
  }
  private _currentPlayer: PlayerPosition
  public get currentPlayer() {
    return this._currentPlayer
  }
  public get currentPlayerName(): string {
    return (
      this.currentPlayer === PlayerPosition.O
        ? this.playerO_Name
        : this.playerX_Name
    ) as string
  }
  public get isComplete(): boolean {
    return this.playerO_Name !== undefined && this.playerX_Name !== undefined
  }
  public play(cellIndex: number) {
    if (this.isGameOver) {
      throw new Error(ErrorMessages.GAME_OVER)
    }
    if (this._board[cellIndex] !== null) {
      throw new Error(ErrorMessages.CELL_ALREADY_OCCUPIED)
    }
    this._board[cellIndex] = this._currentPlayer
    if (this.isPlayerO_Winning || this.isPlayerX_Winning || this.isDraw) {
      this._isGameOver = true
      return
    }
    this._currentPlayer =
      this._currentPlayer === PlayerPosition.O
        ? PlayerPosition.X
        : PlayerPosition.O
  }
  private _isGameOver = false
  public get isGameOver() {
    return this._isGameOver
  }
  public isCellOccupied(cellIndex: number) {
    return this._board[cellIndex] !== null
  }
  public getPlayerNameByPosition(playerPosition: PlayerPosition) {
    return (
      playerPosition === PlayerPosition.O
        ? this.playerO_Name
        : this.playerX_Name
    ) as string
  }
  public getPlayerPositionByName(playerName: string) {
    return playerName === this.playerO_Name
      ? PlayerPosition.O
      : PlayerPosition.X
  }
  public get winnerPlayerName() {
    if (!this.isGameOver) {
      throw new Error(ErrorMessages.GAME_NOT_OVER_YET_NO_WINNER)
    }
    if (this.isDraw) {
      throw new Error(ErrorMessages.GAME_IS_DRAW_NO_WINNER)
    }
    return (
      this.isPlayerO_Winning ? this.playerO_Name : this.playerX_Name
    ) as string
  }
  public get winnerPlayerPosition() {
    return this.getPlayerPositionByName(this.winnerPlayerName)
  }
  public get loserPlayerName() {
    if (!this.isGameOver) {
      throw new Error(ErrorMessages.GAME_NOT_OVER_YET_NO_LOSER)
    }
    if (this.isDraw) {
      throw new Error(ErrorMessages.GAME_IS_DRAW_NO_LOSER)
    }
    return (
      this.isPlayerO_Winning ? this.playerX_Name : this.playerO_Name
    ) as string
  }
  public get loserPlayerPosition() {
    return this.getPlayerPositionByName(this.loserPlayerName)
  }
  toJSON() {
    return Object.fromEntries(
      [
        'gameName',
        'playerO_Name',
        'playerX_Name',
        'board',
        'currentPlayer',
        'isPlayerO_Winning',
        'isPlayerX_Winning',
        'isDraw',
        'isGameOver',
      ].map((prop) => [prop, (this as any)[prop]])
    )
  }
}
export class ErrorMessages {
  public static readonly GAME_OVER = 'La partie est déjà terminée'
  public static readonly CELL_ALREADY_OCCUPIED =
    'Cet emplacement a déjà été joué'
  public static readonly GAME_NOT_OVER_YET_NO_WINNER =
    'the game is not over yet, and thus there is no winner player yet'
  public static readonly GAME_IS_DRAW_NO_WINNER =
    'this game is over by draw, and thus there is no winner player'
  public static readonly GAME_NOT_OVER_YET_NO_LOSER =
    'the game is not over yet, and thus there is no loser player yet'
  public static readonly GAME_IS_DRAW_NO_LOSER =
    'this game is over by draw, and thus there is no loser player'
}
