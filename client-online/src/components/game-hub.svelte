<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { getRandomWord } from '../../../game-engine/utils'
  import { Player } from '../../../game-engine/game-engine'
  import type { CreateGameEvent } from '../custom-events/create-game'

  let playerName = getRandomWord(10)
  let newGameName = ''
  let _pendingGames: Set<string> = new Set()
  let hasJoined = false
  let selectedGame = ''
  const dispatchEvent = createEventDispatcher()

  function onClickPlayerLogin() {
    dispatchEvent('player-login', {
      'player-name': playerName,
    })
    hasJoined = true
    newGameName = getRandomWord(10)
    onClickRefreshGamesList()
  }

  function onClickCreateGame() {
    dispatchEvent('create-game', {
      'initiator-player-name': playerName,
      'initiator-player-position': Player.O,
    } as CreateGameEvent)
  }

  function onClickJoinGame() {
    dispatchEvent('join-game', {
      'game-name': selectedGame,
      'player-name': playerName,
      'player-position': Player.X,
    })
  }

  function onClickRefreshGamesList() {
    fetch('http://localhost:3000/pending-games', {
      method: 'GET',
    })
      .then((response) => {
        console.log({ 'get-pending-games-reponse-status': response.status })
        return response.json()
      })
      .then(
        ({ 'pending-games': pendingGames }: { 'pending-games': string[] }) => {
          _pendingGames = new Set(pendingGames)
        }
      )
      .catch((error) => {
        console.error('Error:', error)
      })
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
  <button
    on:click={onClickCreateGame}
    style="grid-column: 2 / 2; grid-row: 3 / 3"
    disabled={!hasJoined || _pendingGames.has(newGameName)}
    >Create a new game</button
  >
  <label for="new-game-name" style="grid-column: 1 / span 2; grid-row: 4 / 4"
    >Join a game</label
  >
  <select
    bind:value={selectedGame}
    disabled={!hasJoined}
    style="grid-column: 1 / 1; grid-row: 5 / 5"
  >
    <option />
    {#each [..._pendingGames] as game}
      <option value={game}>{game}</option>
    {/each}
  </select>
  <button
    on:click={onClickJoinGame}
    disabled={!hasJoined || !selectedGame}
    style="grid-column: 2 / 2; grid-row: 5 / 5">Join</button
  >
  <button
    on:click={onClickRefreshGamesList}
    disabled={!hasJoined}
    style="grid-column: 3 / 3; grid-row: 5 / 5">Refresh</button
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
