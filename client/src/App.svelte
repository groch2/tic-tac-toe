<script>
  import { onMount } from 'svelte'
  import { allAxes } from '../../tic-tac-toe-game/tic-tac-toe-game'
  const board = new Array(9).fill(null)
  let playerTurn = true
  let [is_X_PlayerWin, is_O_PlayerWin, isDraw, isGameOver] = new Array(4).fill(
    false
  )
  const axeValues = (axe) => axe.map((index) => board[index])
  const onCellClick = (cell, index) => {
    if (isGameOver || isDraw || board[index] !== null) return
    board[index] = playerTurn
    cell.innerText = playerTurn ? 'O' : 'X'
    is_O_PlayerWin = allAxes.some((axe) =>
      axeValues(axe).every((value) => value === true)
    )
    if (is_O_PlayerWin) {
      isGameOver = true
      return
    }
    is_X_PlayerWin = allAxes.some((axe) =>
      axeValues(axe).every((value) => value === false)
    )
    if (is_X_PlayerWin) {
      isGameOver = true
      return
    }
    isDraw =
      !is_O_PlayerWin &&
      !is_X_PlayerWin &&
      board.every((value) => value !== null)
    if (isDraw) return
    playerTurn = !playerTurn
  }
  let allCells
  onMount(() => (allCells = document.querySelectorAll('.board > div')))
  const reset = () => {
    allCells.forEach((cell) => (cell.innerText = ''))
    board.fill(null)
    playerTurn = true
    ;[is_X_PlayerWin, is_O_PlayerWin, isDraw, isGameOver] = new Array(3).fill(
      false
    )
  }
</script>

<div class="root-container">
  <div class="board">
    {#each new Array(9).fill() as _, index}
      <div on:click={(event) => onCellClick(event.target, index)} />
    {/each}
  </div>
  <div>
    {`player turn: ${playerTurn ? 'O' : 'X'}`}
  </div>
  <button on:click={reset} style="width:fit-content"> Reset </button>
  {#if is_O_PlayerWin}
    <div>Player O as won !</div>
  {:else if is_X_PlayerWin}
    <div>Player X as won !</div>
  {:else if isDraw}
    <div>Draw game...</div>
  {/if}
</div>

<style>
  .root-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .board {
    --cell-size: 3em;
    display: grid;
    grid-template-columns: repeat(3, var(--cell-size));
    grid-auto-rows: var(--cell-size);
    line-height: var(--cell-size);
    gap: 1px;
    border: 1px solid;
    width: fit-content;
    text-align: center;
  }
  .board > div {
    outline: 1px solid;
    font-size: x-large;
  }
</style>
