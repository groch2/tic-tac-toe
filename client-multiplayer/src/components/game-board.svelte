<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { GameEngine as Game } from '../../../game-engine/game-engine'
  import { getRandomWord } from '../../../game-engine/utils'
  import type { GameBeginningEvent } from '../../../server/game-beginning-event'

  let isGameActive = false

  const newGame = () => {
    const gameName = getRandomWord(10)
    const playerO_Name = getRandomWord(10)
    const playerX_Name = getRandomWord(10)
    return new Game(gameName, playerO_Name, playerX_Name)
  }

  let game = newGame()
  const onCellClick = (cell: HTMLElement, index: number) => {
    console.debug('click on game board')
    if (game.isGameOver || game.isCellOccupied(index) || !isGameActive) return
    cell.innerText = game.currentPlayer
    game.play(index)
    game = game
  }

  const gameBeginningEventHandler = ({
    detail: {
      'game-name': gameName,
      'opponent-player-name': opponentPlayerName,
    },
  }: CustomEvent<GameBeginningEvent>) => {
    console.log({ gameName, opponentPlayerName })
    isGameActive = true
  }

  let allCells: NodeListOf<Element>
  onMount(() => {
    allCells = document.querySelectorAll('.board > div')
    document.addEventListener('game-beginning', gameBeginningEventHandler)
  })
  const reset = () => {
    allCells.forEach((cell: HTMLElement) => (cell.innerText = ''))
    game = newGame()
  }

  onDestroy(() => {
    document.removeEventListener('game-beginning', gameBeginningEventHandler)
  })
</script>

<div class="main-container">
  <div class="board" class:disabled-board={!isGameActive}>
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
  .main-container {
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
  .disabled-board {
    color: #ccc;
    background-color: #f4f4f4;
  }
  .board > div {
    outline: 1px solid;
    font-size: x-large;
  }
</style>
