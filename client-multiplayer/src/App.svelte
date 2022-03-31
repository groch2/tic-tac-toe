<script lang="ts">
  import GameBoard from './components/game-board.svelte'
  import GameHub from './components/game-hub.svelte'
  const components = [GameHub, GameBoard]
  let selectedComponent = components[0]
  function joinGame(event: CustomEvent) {
    console.log(JSON.stringify(event.detail))
    const gameName = event.detail['game-name']
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
  <svelte:component this={selectedComponent} on:join-game={joinGame} />
</main>
