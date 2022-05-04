<script lang="ts">
  import { createEventDispatcher,onMount } from 'svelte'
  import {
  GameEngine as Game,
  PlayerPosition
  } from '../../../game-engine/game-engine'
  import { getRandomWord } from '../../../game-engine/utils'
  import type { EndOfGamePlayerNotification } from '../../../server/end-of-game-player-notification'
  import type { GameBeginningEvent } from '../../../server/game-beginning-event'
  import type { PlayGameEvent } from '../../../server/play-game-event'
  import type { PlayGameRequest } from '../../../server/play-game-request'
  import { PlayerEndOfGameStatus } from '../../../server/player-end-of-game-status'
  import type { QuitGameRequest } from '../../../server/quit-game-request'
  import config from '../../app-config.json'

  export let playerName: string
  export let playerPosition: PlayerPosition = null
  export let isPlayerGameInitiator: boolean
  export let gameInitiatorPlayerName: string
  export let eventSource: EventSource

  enum Turn {
    Player,
    Opponent,
  }

  let isGameStarted = false
  let turn: Turn = null
  let opponentPlayerName: string = null
  $: opponentPlayerPosition =
    playerPosition === null
      ? null
      : playerPosition === PlayerPosition.O
      ? PlayerPosition.X
      : PlayerPosition.O

  function bindToGameBeginningEvent(eventSource: EventSource) {
    eventSource.addEventListener('game-beginning', (event) => {
      const { 'opponent-player-name': _opponentPlayerName } = JSON.parse(
        event.data
      ) as GameBeginningEvent
      opponentPlayerName = _opponentPlayerName
      isGameStarted = true
      turn = Turn.Player
    })
  }

  function bindToPlayGameEvent(eventSource: EventSource) {
    eventSource.addEventListener('play-game', (event) => {
      const { 'cell-index-played': cellIndex } = JSON.parse(
        event.data
      ) as PlayGameEvent
      cells[cellIndex].innerHTML = game.currentPlayer
      game.play(cellIndex)
      game = game
      turn = Turn.Player
    })
  }

  function bindToEndOfGameEvent(eventSource: EventSource) {
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
        } by opponent ${isEndOfGameByForfeit ? 'forfeit' : 'defeat'}`
      )
      turn = null
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
    if (game.isGameOver || game.isCellOccupied(index) || turn !== Turn.Player)
      return
    fetch(`${config.webApiBaseUrl}/game/play`, {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        'game-initiator-player-name': gameInitiatorPlayerName,
        'player-name': playerName,
        'cell-index-played': index,
      } as PlayGameRequest),
    })
      .then((response) => {
        if (response.ok) {
          cell.innerText = game.currentPlayer
          game.play(index)
          game = game
          turn = Turn.Opponent
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

  const dispatchEvent = createEventDispatcher()
  function quit() {
    fetch(`${config.webApiBaseUrl}/game/quit`, {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        'game-initiator-player-name': gameInitiatorPlayerName,
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
    bindToGameBeginningEvent(eventSource)
    bindToPlayGameEvent(eventSource)
    bindToEndOfGameEvent(eventSource)
    isGameStarted = !isPlayerGameInitiator
    turn = !isPlayerGameInitiator ? Turn.Opponent : null
    opponentPlayerName = !isPlayerGameInitiator ? gameInitiatorPlayerName : null
  })
</script>

<div class="main-container">
  <table class="players-data">
    <thead>
      <tr>
        <th>Players</th>
        <th>Name</th>
        <th>Position</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>you</td>
        <td>{playerName}</td>
        <td>{playerPosition}</td>
      </tr>
      <tr>
        <td>opponent</td>
        <td
          >{#if !isGameStarted}
            waiting for opponent
          {:else}
            {opponentPlayerName}
          {/if}
        </td>
        <td>{opponentPlayerPosition}</td>
      </tr>
    </tbody>
  </table>
  <div
    class="board"
    class:disabled-board={!isGameStarted || turn === Turn.Opponent}
  >
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
  table.players-data,
  table.players-data th,
  table.players-data td {
    border: 1px solid black;
    border-collapse: collapse;
  }
  table.players-data th,
  table.players-data td {
    text-align: center;
    padding-left: 5px;
    padding-right: 5px;
  }
  table.players-data td:first-child {
    font-weight: bold;
    text-align: end;
  }
  table.players-data th:first-child {
    font-size: large;
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
