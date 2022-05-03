<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import type { CreateGameRequest } from '../../server/create-game-request'
  import type { JoinGameRequest } from '../../server/join-game-request'
  import GameBoard from './components/game-board.svelte'
  import GameHub from './components/game-hub.svelte'
  import type { CreateGameEvent } from './custom-events/create-game'
  import type { JoinGameEvent } from './custom-events/join-game'
  import type { PlayerLoginEvent } from './custom-events/player-login'

  enum ActiveComponent {
    Hub,
    GameBoard,
  }

  let eventSource: EventSource
  let _gameInitiatorPlayerName: string = null
  let _playerName: string = null
  let activeComponent = ActiveComponent.Hub

  function playerLoginEventHandler({
    detail: { 'player-name': playerName },
  }: CustomEvent<PlayerLoginEvent>) {
    eventSource?.close()
    eventSource = new EventSource(
      `http://localhost:3000/player/login?player-name=${playerName}`
    )
    eventSource.onopen = () => {
      console.log('event source opened')
    }
    eventSource.onerror = () => {
      console.log(`event source error`)
    }
    eventSource.addEventListener('game-beginning', (event) => {
      console.debug('in App.svelte component', 'game begining event...')
      console.log('in App.svelte component', 'game begining event...')
    })
    eventSource.addEventListener('test', (event) => {
      console.log('test event handling, client side')
    })
    eventSource.onmessage = (eventMessage) => {
      console.debug('in App.svelte component, onmessage handler', {
        'event-source-message': eventMessage,
      })
    }
    console.debug({
      'event-source-state': ((eventSourceState) =>
        new Map<number, string>([
          [EventSource.CLOSED, 'closed'],
          [EventSource.CONNECTING, 'connecting'],
          [EventSource.OPEN, 'open'],
        ]).get(eventSourceState) as string)(eventSource.readyState),
    })
  }

  function createGameEventHandler({
    detail: {
      'game-initiator-player-name': gameInitiatorPlayerName,
      'game-initiator-player-position': gameInitiatorPlayerPosition,
    },
  }: CustomEvent<CreateGameEvent>) {
    if (eventSource?.readyState !== EventSource.OPEN) {
      throw new Error('player is not logged in')
    }
    fetch('http://localhost:3000/game/create', {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        'initiator-player-name': gameInitiatorPlayerName,
        'initiator-player-position': gameInitiatorPlayerPosition,
      } as CreateGameRequest),
    })
      .then((response) => {
        console.log({
          'create-game-response': {
            'response-status': response.status,
            'status-text': response.statusText,
          },
        })
        _gameInitiatorPlayerName = gameInitiatorPlayerName
        _playerName = _gameInitiatorPlayerName
        activeComponent = ActiveComponent.GameBoard
      })
      .catch((error) => {
        console.error('Error:', error)
      })
  }

  function joinGameEventHandler({
    detail: {
      'game-initiator-player-name': gameInitiatorPlayerName,
      'joining-player-name': joiningPlayerName,
      'joining-player-position': joiningPlayerPosition,
    },
  }: CustomEvent<JoinGameEvent>) {
    fetch('http://localhost:3000/game/join', {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        'game-initiator-player-name': gameInitiatorPlayerName,
        'joining-player-name': joiningPlayerName,
        'joining-player-position': joiningPlayerPosition,
      } as JoinGameRequest),
    })
      .then((response) => {
        console.log({
          'join-game-response': {
            'response-status': response.status,
            'status-text': response.statusText,
          },
        })
        _gameInitiatorPlayerName = gameInitiatorPlayerName
        _playerName = joiningPlayerName
        activeComponent = ActiveComponent.GameBoard
      })
      .catch((error) => {
        console.error('Error:', error)
      })
  }

  function quitGameEventHandler() {
    activeComponent = ActiveComponent.Hub
  }
  onMount(() => {
    document.addEventListener('quit-game', quitGameEventHandler)
  })
  onDestroy(() => {
    document.removeEventListener('quit-game', quitGameEventHandler)
    eventSource?.close()
  })
</script>

{#if activeComponent == ActiveComponent.Hub}
  <GameHub
    on:player-login={playerLoginEventHandler}
    on:create-game={createGameEventHandler}
    on:join-game={joinGameEventHandler}
  />
{:else if activeComponent == ActiveComponent.GameBoard}
  <GameBoard
    on:quit-game={quitGameEventHandler}
    bind:gameInitiatorPlayerName={_gameInitiatorPlayerName}
    bind:playerName={_playerName}
    bind:eventSource
  />
{/if}
