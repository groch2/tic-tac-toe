<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte'
  import { GameEngine as Game } from '../../../game-engine/game-engine'
  import { getRandomWord } from '../../../game-engine/utils'
  import type { GameBeginningEvent } from '../../../server/game-beginning-event'
  import type { PlayGameRequest } from '../../../server/play-game-request'
  import type { PlayGameEvent } from '../../../server/play-game-event'
  import type { EndOfGamePlayerNotification } from '../../../server/end-of-game-player-notification'
  import type { QuitGameRequest } from '../../../server/quit-game-request'
  import { BoardComponentOrigin } from '../custom-types'
  import { PlayerEndOfGameStatus } from '../../../server/player-end-of-game-status'

  export let gameName: string
  export let playerName: string
  export let isGameActive = false
  export let boardComponentOrigin: BoardComponentOrigin

  export function bindToGameBeginningEvent(eventSource: EventSource) {
    eventSource.addEventListener('game-beginning', (event) => {
      const { 'opponent-player-name': opponentPlayerName } = JSON.parse(
        event.data
      ) as GameBeginningEvent
      console.log(`playing against: "${opponentPlayerName}"`)
      isGameActive = true
    })
  }

  export function bindToPlayGameEvent(eventSource: EventSource) {
    eventSource.addEventListener('play-game', (event) => {
      console.debug(`play game event`)
      const { 'cell-index-played': cellIndex } = JSON.parse(
        event.data
      ) as PlayGameEvent
      console.log({ 'cell-played-by-opponent': cellIndex })
      cells[cellIndex].innerHTML = game.currentPlayer
      game.play(cellIndex)
      game = game
      isGameActive = true
    })
  }

  export function bindToEndOfGameEvent(eventSource: EventSource) {
    console.log('binding to end of game event')
    eventSource.addEventListener('end-of-game', (event) => {
      console.log('end of game event received')
      const {
        'player-end of-game-status': playerEndOfGameStatus,
        'is-end-of-game-by-forfeit': isEndOfGameByForfeit,
      } = JSON.parse(event.data) as EndOfGamePlayerNotification
      console.log(
        `You ${
          playerEndOfGameStatus === PlayerEndOfGameStatus.WINNER
            ? 'won'
            : 'lost'
        } by ${isEndOfGameByForfeit ? 'forfeit' : 'defeat'}`
      )
      isGameActive = false
    })
  }

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
    fetch('http://localhost:3000/play-game', {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        'game-name': gameName,
        'player-name': playerName,
        'cell-index': index,
      } as PlayGameRequest),
    })
      .then((response) => {
        if (response.ok) {
          cell.innerText = game.currentPlayer
          game.play(index)
          game = game
          isGameActive = false
        } else {
          console.log('Network error on play request', {
            'response-status': response.status,
            'status-text': response.statusText,
          })
        }
      })
      .catch((error) => {
        console.error('Error:', error)
      })
  }

  export const playGameEventHandler = (lastMoveCell: number) => {
    game.play(lastMoveCell)
    game = game
    isGameActive = true
  }

  const dispatchEvent = createEventDispatcher()
  function quit() {
    fetch('http://localhost:3000/quit-game', {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        'game-name': gameName,
        'quitter-player-name': playerName,
      } as QuitGameRequest),
    })
      .then((response) => {
        if (!response.ok) {
          console.log('Network error on play request', {
            'response-status': response.status,
            'status-text': response.statusText,
          })
        }
      })
      .catch((error) => {
        console.error('Error:', error)
      })
      .finally(() => {
        dispatchEvent('quit-game')
      })
  }

  let cells: HTMLCollection
  onMount(() => {
    cells = document.querySelector('div.board').children
    isGameActive = boardComponentOrigin === BoardComponentOrigin.CreateNewGame
  })
</script>

<div class="main-container">
  <h1 id="game-name">{gameName}</h1>
  <div class="board" class:disabled-board={!isGameActive}>
    {#each new Array(9).fill(0) as _, index}
      <div on:click={(event) => onCellClick(event.currentTarget, index)} />
    {/each}
  </div>
  <div>
    {`player turn: ${game.currentPlayer}`}
  </div>
  <button on:click={quit} style="width:fit-content"> Quit </button>
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
    display: inline-flex;
    flex-direction: column;
    gap: 10px;
  }
  h1[id='game-name'] {
    text-align: center;
    font-size: larger;
    margin-block-start: 0;
    margin-block-end: 0;
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
    justify-self: center;
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