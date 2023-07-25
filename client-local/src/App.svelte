<script lang="ts">
  import { onMount } from 'svelte'
  import { GameEngine as Game } from '../../game-engine/game-engine'
  import { getRandomWord } from '../../game-engine/utils'
  const newGame = () => {
    const gameName = getRandomWord(10)
    const playerO_Name = getRandomWord(10)
    const playerX_Name = getRandomWord(10)
    return new Game(gameName, playerO_Name, playerX_Name)
  }
  let game = newGame()
  const onCellClick = (cell: HTMLElement, index: number) => {
    console.log(`click on cell: ${index}`)
    if (game.isGameOver || game.isCellOccupied(index)) return
    cell.innerText = game.currentPlayer
    game.play(index)
    game = game
  }
  let allCells: NodeListOf<Element>
  let winningAxeCanvas: HTMLCanvasElement
  onMount(() => {
    allCells = document.querySelectorAll('.board > div')

    winningAxeCanvas = document.getElementById(
      'winning-axe-canvas'
    ) as HTMLCanvasElement

    const { height, width } = winningAxeCanvas

    var ctx = winningAxeCanvas.getContext('2d')

    ctx.moveTo(0, 0)
    ctx.lineTo(width, height)

    ctx.moveTo(width, 0)
    ctx.lineTo(0, height)

    ctx.stroke()
  })
  const reset = () => {
    allCells.forEach((cell: HTMLElement) => (cell.innerText = ''))
    game = newGame()
  }
</script>

<div class="root-container">
  <div class="board" style="position: relative;">
    <canvas
      id="winning-axe-canvas"
      style="position: absolute; width: 100%; height: 100%; z-index: -1;"
    />
    {#each new Array(9).fill(0) as _, index}
      <div on:click={(event) => onCellClick(event.currentTarget, index)} />
    {/each}
  </div>
  <div>
    {`player turn: ${game.currentPlayer}`}
  </div>
  <button on:click={reset} style="width:fit-content"> Reset </button>
  <span>
    {#if game.isPlayerO_Winning}
      Player O as won !
    {:else if game.isPlayerX_Winning}
      Player X as won !
    {:else if game.isDraw}
      Draw game...
    {/if}
  </span>
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
