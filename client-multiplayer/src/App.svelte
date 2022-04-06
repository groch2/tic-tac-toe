<script lang="ts">
  import GameBoard from './components/game-board.svelte'
  import GameHub from './components/game-hub.svelte'

  const components = [GameHub, GameBoard]
  let selectedComponent: typeof GameHub | typeof GameBoard = components[0]

  function playerLogin(event: CustomEvent) {
    const playerName = event.detail['player-name'] as string
    console.log(`player logged-in: "${playerName}"`)
  }

  function gameCreated(event: CustomEvent) {
    const gameName = event.detail['game-name'] as string
    console.log(`new game created: "${gameName}"`)
    if (gameName) {
      selectedComponent = GameBoard
    }
  }

  function joinGame(event: CustomEvent) {
    const gameName = event.detail['game-name'] as string
    console.log(`player has joined a game: "${gameName}"`)
    if (gameName) {
      selectedComponent = GameBoard
    }
  }
</script>

<main>
  <div style="display:flex;gap:10px">
    {#each components as component, index}
      <button
        disabled={selectedComponent === component}
        on:click={() => (selectedComponent = component)}
        >Component {index + 1}</button
      >
    {/each}
  </div>
  <svelte:component
    this={selectedComponent}
    on:player-login={playerLogin}
    on:game-created={gameCreated}
    on:join-game={joinGame}
  />
</main>
