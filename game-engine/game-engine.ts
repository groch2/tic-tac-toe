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
  public get isPlayerO_Winning() {
    return this.isPlayerWinning(PlayerPosition.O)
  }
  public get isPlayerX_Winning() {
    return this.isPlayerWinning(PlayerPosition.X)
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
      this.currentPlayer === PlayerPosition.O ? this.playerO_Name : this.playerX_Name
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
    this._currentPlayer = this._currentPlayer === PlayerPosition.O ? PlayerPosition.X : PlayerPosition.O
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
      playerPosition === PlayerPosition.O ? this.playerO_Name : this.playerX_Name
    ) as string
  }
  public getPlayerPositionByName(playerName: string) {
    return playerName === this.playerO_Name ? PlayerPosition.O : PlayerPosition.X
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
}
