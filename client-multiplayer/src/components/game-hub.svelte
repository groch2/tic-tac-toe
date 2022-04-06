<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { getRandomWord } from '../../../game-engine/utils'
  import { onDestroy } from 'svelte'
  import type { GameBeginningEvent } from '../../../server/game-beginning-event'
  import type { PlayGameEvent } from '../../../server/play-game-event'
  import { getGameBeginningEvent } from '../custom-events/game-beginning'
  import { getPlayGameEvent } from '../custom-events/play-game'

  let playerName = getRandomWord(10)
  let newGameName = ''
  let eventSource: EventSource
  let _pendingGames: Set<string> = new Set()
  let hasJoined = false
  let selectedGame = ''
  const eventDispatcher = createEventDispatcher()

  function onClickPlayerLogin() {
    eventDispatcher('player-login', {
      'player-name': playerName,
    })
    hasJoined = true
    newGameName = getRandomWord(10)
  }

  function onClickCreateGame() {
    closeEventSource()
    console.debug(`creating new game: "${newGameName}"`)
    eventSource = new EventSource(
      `http://localhost:3000/create-game?game-name=${newGameName}&player-name=${playerName}&player-position=O`
    )
    eventSource.onopen = () => {
      console.log('event source opened')
      eventDispatcher('game-created', { 'game-name': newGameName })
    }
    eventSource.onerror = () => {
      console.log(`event source error`)
    }
    eventSource.addEventListener('game-beginning', (event) => {
      const gameBeginningServerEvent = JSON.parse(
        event.data
      ) as GameBeginningEvent
      const gameBeginningEvent = getGameBeginningEvent(gameBeginningServerEvent)
      const gameBeginningEventDispatched =
        document.dispatchEvent(gameBeginningEvent)
      console.log({ gameBeginningEventDispatched })
    })
    eventSource.addEventListener('play-game', (event) => {
      const playGameServerEvent = JSON.parse(event.data) as PlayGameEvent
      const playGameEvent = getPlayGameEvent(playGameServerEvent)
      const playGameEventDispatched = document.dispatchEvent(playGameEvent)
      console.log({ playGameEventDispatched })
    })
  }

  function onClickRefreshGamesList() {
    fetch('http://localhost:3000/pending-games', {
      method: 'GET',
    })
      .then((response) => response.json())
      .then(
        ({ 'pending-games': pendingGames }: { 'pending-games': string[] }) => {
          _pendingGames = new Set(pendingGames)
        }
      )
      .catch((error) => {
        console.error('Error:', error)
      })
  }

  function onClickJoinGame() {
    eventDispatcher('join-game', { 'game-name': selectedGame })
  }

  onDestroy(() => closeEventSource())

  function closeEventSource() {
    if (
      eventSource !== undefined &&
      eventSource.readyState !== EventSource.CLOSED
    ) {
      eventSource.close()
    }
  }
</script>

<div class="main-container">
  <label for="player-name" style="grid-column:1 / span 2;grid-row:1 / 1"
    >Player name</label
  >
  <input
    id="player-name"
    type="text"
    bind:value={playerName}
    style="grid-column: 1 / 1; grid-row: 2 / 2"
  />
  <button
    on:click={onClickPlayerLogin}
    style="grid-column: 2 / 2; grid-row: 2 / 2">Login</button
  >
  <label for="new-game-name" style="grid-column: 1 / span 2; grid-row: 3 / 3"
    >Create a new game</label
  >
  <input
    disabled={!hasJoined}
    id="new-game-name"
    type="text"
    bind:value={newGameName}
    style="grid-column: 1 / 1; grid-row: 4 / 4"
  />
  <button
    on:click={onClickCreateGame}
    style="grid-column: 2 / 2; grid-row: 4 / 4"
    disabled={!hasJoined || _pendingGames.has(newGameName)}>Create</button
  >
  <label for="new-game-name" style="grid-column: 1 / span 2; grid-row: 5 / 5"
    >Join a game</label
  >
  <select
    bind:value={selectedGame}
    disabled={!hasJoined}
    style="grid-column: 1 / 1; grid-row: 6 / 6"
  >
    <option />
    {#each [..._pendingGames] as game}
      <option value={game}>{game}</option>
    {/each}
  </select>
  <button
    on:click={onClickJoinGame}
    disabled={!hasJoined}
    style="grid-column: 2 / 2; grid-row: 6 / 6">Join</button
  >
  <button
    on:click={onClickRefreshGamesList}
    disabled={!hasJoined}
    style="grid-column: 3 / 3; grid-row: 6 / 6">Refresh</button
  >
</div>

<style>
  .main-container {
    display: inline-grid;
    grid-template-columns: 10em auto auto;
    grid-template-rows: repeat(6, auto);
    gap: 5px;
  }
</style>
