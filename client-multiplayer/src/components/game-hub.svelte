<script lang="ts">
  import { onDestroy } from 'svelte'
  import { getRandomWord } from '../../../game-engine/utils'
  import { createEventDispatcher } from 'svelte'

  let playerName = getRandomWord(10)
  let newGameName = ''
  let pendingGames: Set<string> = new Set()
  let webSocket: WebSocket
  let hasJoined = false
  let selectedGame = ''
  const eventDispatcher = createEventDispatcher()

  function onClickPlayerLogin() {
    if (webSocket) {
      webSocket.close(1000, 'the player has logged-in with a new name')
    }
    webSocket = new WebSocket(
      `ws://localhost:3000/websockets?player-name=${playerName}`
    )
    webSocket.onopen = function (_) {
      hasJoined = true
      newGameName = getRandomWord(10)
    }
    eventDispatcher('player-login', {
      'player-name': playerName,
      'web-socket': webSocket,
    })
    webSocket.onmessage = function (event) {
      const { 'event-type': eventType }: { 'event-type': string } = JSON.parse(
        event.data
      )
      switch (eventType) {
        case 'new-game-created':
          const { 'game-name': gameName }: { 'game-name': string } = JSON.parse(
            event.data
          )
          pendingGames = pendingGames.add(gameName)
          break
        default:
          throw new Error(`unknown event type: "${eventType}"`)
      }
    }
  }

  function onClickCreateGame() {
    fetch('http://localhost:3000/create-game', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 'game-name': newGameName }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Success:', data)
      })
      .catch((error) => {
        console.error('Error:', error)
      })
  }

  function onClickJoinGame() {
    eventDispatcher('join-game', {
      'game-name': selectedGame,
    })
  }

  onDestroy(() => {
    if (!webSocket) return
    switch (webSocket.readyState) {
      case WebSocket.CLOSED:
      case WebSocket.CLOSING:
        return
      default:
        webSocket.close(1000, "the player has closed it's connection")
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
    disabled={!hasJoined || pendingGames.has(newGameName)}>Create</button
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
    {#each [...pendingGames] as game}
      <option value={game}>{game}</option>
    {/each}
  </select>
  <button
    on:click={onClickJoinGame}
    disabled={!hasJoined || !pendingGames.has(selectedGame)}
    style="grid-column: 2 / 2; grid-row: 6 / 6">Join</button
  >
</div>

<style>
  .main-container {
    display: inline-grid;
    grid-template-columns: 10em auto;
    grid-template-rows: repeat(6, auto);
    gap: 5px;
  }
</style>
