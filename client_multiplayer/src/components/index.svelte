<script>
  import Component_1 from './component_1.svelte'
  import Component_2 from './component_2.svelte'
  import Component_3 from './component_3.svelte'
  import Hub from '../App.svelte'
  const components = [Component_1, Component_2, Component_3]
  let selectedComponent = Component_1
</script>

<Hub />
<div style="display:flex;gap:10px">
  {#each new Array(3) as _, index}
    <button
      disabled={selectedComponent === components[index]}
      on:click={() => (selectedComponent = components[index])}
      >Component {index + 1}</button
    >
  {/each}
</div>
<svelte:component this={selectedComponent} />

<style>
  :global(h1) {
    --horizontal-sides-padding: 5px;
    color: white;
    width: fit-content;
    padding: 0 var(--horizontal-sides-padding) 0 var(--horizontal-sides-padding);
  }
</style>
