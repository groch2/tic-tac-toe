<script lang="ts">
  import { onMount } from 'svelte'
  import { createEventDispatcher } from 'svelte'
  import { PlayerPosition } from '../../../game-engine/game-engine'
  import { getRandomWord } from '../../../game-engine/utils'
  import config from '../../app-config.json'
  import type { CreateGameEvent } from '../custom-events/create-game'
  import type { JoinGameEvent } from '../custom-events/join-game'

  let playerName = getRandomWord(10)
  let _pendingGamesInitiatorsPlayersNames: Set<string> = new Set()
  let hasJoined = false
  let selectedGame = ''
  const dispatchEvent = createEventDispatcher()

  function onClickPlayerLogin() {
    dispatchEvent('player-login', {
      'player-name': playerName,
    })
    hasJoined = true
    onClickRefreshGamesList()
  }

  function onClickCreateGame() {
    dispatchEvent('create-game', {
      'game-initiator-player-name': playerName,
      'game-initiator-player-position': PlayerPosition.O,
    } as CreateGameEvent)
  }

  function onClickJoinGame() {
    dispatchEvent('join-game', {
      'game-initiator-player-name': selectedGame,
      'joining-player-name': playerName,
      'joining-player-position': PlayerPosition.X,
    } as JoinGameEvent)
  }

  function onClickRefreshGamesList() {
    fetch(`${config.webApiBaseUrl}/games/pending`, {
      method: 'GET',
    })
      .then((response) => {
        console.log({
          'get-pending-games-initiators-players-names-reponse-status':
            response.status,
        })
        return response.json()
      })
      .then(
        ({
          'pending-games-initiators-players-names':
            pendingGamesInitiatorsPlayersNames,
        }: {
          'pending-games-initiators-players-names': string[]
        }) => {
          _pendingGamesInitiatorsPlayersNames = new Set(
            pendingGamesInitiatorsPlayersNames
          )
        }
      )
      .catch((error) => {
        console.error('Error:', error)
      })
  }

  onMount(() => {
    const playerNameFromSession = sessionStorage.getItem('player-name')
    if (playerNameFromSession !== null) {
      playerName = playerNameFromSession
      onClickPlayerLogin()
    }
  })
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
    disabled={!hasJoined}>Create a new game</button
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
    {#each [..._pendingGamesInitiatorsPlayersNames] as game}
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
