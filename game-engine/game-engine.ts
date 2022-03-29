export const getRandomWord = (length: number) =>
  new Array(length)
    .fill(0)
    .map((_) => String.fromCharCode(Math.random() * 26 + 'A'.charCodeAt(0)))
    .join('')
const getGeneratorRange = function* (
  start: number,
  stop: number,
  step: number
) {
  let n = start
  while (n < stop) {
    yield n
    n += step
  }
}
const getRange = (start: number, stop: number, step: number) => [
  ...getGeneratorRange(start, stop, step),
]
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
export enum Player {
  O = 'O',
  X = 'X',
}
export class GameEngine {
  private _board: (Player | null)[]
  public get board() {
    return [...this._board]
  }
  public constructor(
    public readonly gameName: string,
    public playerO_Name?: string,
    public playerX_Name?: string
  ) {
    this._board = new Array(9).fill(null)
    this._currentPlayer = Player.O
  }
  private axeValues = (axe: number[]) => axe.map((index) => this._board[index])
  private isPlayerWinning(player: Player) {
    return allAxes.some((axe) =>
      this.axeValues(axe).every((value) => value === player)
    )
  }
  public get isPlayerO_Winning() {
    return this.isPlayerWinning(Player.O)
  }
  public get isPlayerX_Winning() {
    return this.isPlayerWinning(Player.X)
  }
  public get isDraw() {
    return (
      !this.isPlayerO_Winning &&
      !this.isPlayerX_Winning &&
      this._board.every((value) => value !== null)
    )
  }
  private _currentPlayer: Player
  public get currentPlayer() {
    return this._currentPlayer
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
    this._currentPlayer = this._currentPlayer === Player.O ? Player.X : Player.O
  }
  private _isGameOver = false
  public get isGameOver() {
    return this._isGameOver
  }
  public isCellOccupied(cellIndex: number) {
    return this._board[cellIndex] !== null
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
