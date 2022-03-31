<script lang="ts">
  import { onDestroy } from 'svelte'
  import { getRandomWord } from '../../../game-engine/utils'

  let playerName = getRandomWord(10)
  let newGameName = ''
  let pendingGames: string[] = []
  let webSocket: WebSocket
  let hasJoined = false

  function onClickJoinAsNewPlayer() {
    if (webSocket) {
      webSocket.close(null, 'the player has chosen a new name')
    }
    webSocket = new WebSocket(
      `ws://localhost:3000/websockets?player-name=${playerName}`
    )
    webSocket.onopen = function (_) {
      hasJoined = true
      newGameName = getRandomWord(10)
    }
    webSocket.onmessage = function (event) {
      const { 'event-type': eventType }: { 'event-type': string } = JSON.parse(
        event.data
      )
      switch (eventType) {
        case 'new-game-created':
          const { 'game-name': gameName }: { 'game-name': string } = JSON.parse(
            event.data
          )
          pendingGames = [...pendingGames, gameName]
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

  function onClickJoinGame() {}

  onDestroy(() => {
    if (!webSocket) return
    switch (webSocket.readyState) {
      case WebSocket.CLOSED:
      case WebSocket.CLOSING:
        return
      default:
        webSocket.close(null, "the player has closed it's connection")
    }
  })
</script>

<div>
  <div class="label-input-button-group">
    <label for="player-name">Player name</label>
    <input id="player-name" type="text" bind:value={playerName} />
    <button on:click={onClickJoinAsNewPlayer}>Join to play</button>
  </div>
  <div class="label-input-button-group">
    <label for="new-game-name">Create a new game</label>
    <input
      disabled={!hasJoined}
      id="new-game-name"
      type="text"
      bind:value={newGameName}
    />
    <button on:click={onClickCreateGame}>Create game</button>
  </div>
  <div class="label-input-button-group">
    <label for="new-game-name">Join a game</label>
    <select disabled={!hasJoined}>
      {#each pendingGames as game, index}
        <option value={index}>{game}</option>
      {/each}
    </select>
    <button on:click={onClickJoinGame}>Join this game</button>
  </div>
</div>

<style>
  .label-input-button-group {
    display: grid;
    grid-template-columns: 10em 1fr;
    gap: 5px;
    margin: 0 0 0.5em 0;
  }
  .label-input-button-group > label:nth-of-type(1) {
    grid-column: 1 / span 2;
  }
  .label-input-button-group > input:nth-of-type(1),
  .label-input-button-group > select:nth-of-type(1) {
    margin: 0;
  }
  .label-input-button-group > button:nth-of-type(1) {
    margin: 0;
    width: fit-content;
  }
</style>
