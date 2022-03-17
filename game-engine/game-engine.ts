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
enum Player {
  O = 'O',
  X = 'X',
}
export class GameEngine {
  private _board: (Player | null)[]
  public get board() {
    return [...this._board]
  }
  public constructor(public readonly gameName: string) {
    this._board = new Array(9).fill(null)
    this._currentPlayer = Player.O
  }
  axeValues = (axe: number[]) => axe.map((index) => this._board[index])
  isPlayerWinning(player: Player) {
    return allAxes.some((axe) =>
      this.axeValues(axe).every((value) => value === player)
    )
  }
  public get isPlayer_O_Winning() {
    return this.isPlayerWinning(Player.O)
  }
  public get isPlayer_X_Winning() {
    return this.isPlayerWinning(Player.X)
  }
  public get isDraw() {
    return (
      !this.isPlayer_O_Winning &&
      !this.isPlayer_X_Winning &&
      this._board.every((value) => value !== null)
    )
  }
  _currentPlayer: Player
  public get playerTurn() {
    return `${this._currentPlayer}`
  }
  public play(cellIndex: number) {
    if (this.isGameOver) {
      throw new Error(ErrorMessages.GAME_OVER)
    }
    if (this._board[cellIndex] !== null) {
      throw new Error(ErrorMessages.CELL_ALREADY_OCCUPIED)
    }
    this._board[cellIndex] = this._currentPlayer
    if (this.isPlayer_O_Winning || this.isPlayer_X_Winning || this.isDraw) {
      this._isGameOver = true
      return
    }
    this._currentPlayer = this._currentPlayer === Player.O ? Player.X : Player.O
  }
  _isGameOver = false
  public get isGameOver() {
    return this._isGameOver
  }
  isCellOccupied(cellIndex: number) {
    return this._board[cellIndex] !== null
  }
}
export class ErrorMessages {
  public static readonly GAME_OVER = 'La partie est déjà terminée'
  public static readonly CELL_ALREADY_OCCUPIED =
    'Cet emplacement a déjà été joué'
}
