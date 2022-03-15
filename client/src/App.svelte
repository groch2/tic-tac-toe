<script>
  import { onMount } from 'svelte'
  import { Game } from '../../tic-tac-toe-game/tic-tac-toe-game'
  let game = new Game()
  const onCellClick = (cell, index) => {
    game.play(index)
    if (game.isGameOver || isDraw || board[index] !== null) return
    cell.innerText = game.playerTurn()
  }
  let allCells
  onMount(() => (allCells = document.querySelectorAll('.board > div')))
  const reset = () => {
    allCells.forEach((cell) => (cell.innerText = ''))
    game = new Game()
  }
</script>

<div class="root-container">
  <div class="board">
    {#each new Array(9).fill() as _, index}
      <div on:click={(event) => onCellClick(event.target, index)} />
    {/each}
  </div>
  <div>
    {`player turn: ${game.playerTurn()}`}
  </div>
  <button on:click={reset} style="width:fit-content"> Reset </button>
  {#if game.isPlayer_O_Winning}
    <div>Player O as won !</div>
  {:else if game.isPlayer_X_Winning}
    <div>Player X as won !</div>
  {:else if game.isDraw}
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
