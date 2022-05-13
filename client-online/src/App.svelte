<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import type { PlayerPosition } from '../../game-engine/game-engine'
  import type { CreateGameRequest } from '../../server/create-game-request'
  import type { JoinGameRequest } from '../../server/join-game-request'
  import config from '../app-config.json'
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
  let _isPlayerGameInitiator: boolean = null
  let _gameInitiatorPlayerName: string = null
  let _playerName: string = null
  let _playerPosition: PlayerPosition = null
  let activeComponent = ActiveComponent.Hub

  function playerLoginEventHandler({
    detail: { 'player-name': playerName },
  }: CustomEvent<PlayerLoginEvent>) {
    eventSource?.close()
    eventSource = new EventSource(
      `${config.webApiBaseUrl}/player/login?player-name=${playerName}`
    )
    eventSource.onopen = () => {
      console.log('event source opened')
      sessionStorage.setItem('player-name', playerName)
    }
    eventSource.onerror = () => {
      console.log(`event source error`)
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
    fetch(`${config.webApiBaseUrl}/game/create`, {
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
      .then(({ ok }) => {
        if (ok) {
          _isPlayerGameInitiator = true
          _gameInitiatorPlayerName = gameInitiatorPlayerName
          _playerName = gameInitiatorPlayerName
          _playerPosition = gameInitiatorPlayerPosition
          activeComponent = ActiveComponent.GameBoard
        }
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
    fetch(`${config.webApiBaseUrl}/game/join`, {
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
      .then(({ ok }) => {
        if (ok) {
          _isPlayerGameInitiator = false
          _gameInitiatorPlayerName = gameInitiatorPlayerName
          _playerName = joiningPlayerName
          _playerPosition = joiningPlayerPosition
          activeComponent = ActiveComponent.GameBoard
        }
      })
      .catch((error) => {
        console.error('Error:', error)
      })
  }

  function quitGameEventHandler() {
    activeComponent = ActiveComponent.Hub
  }
  onDestroy(() => {
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
    bind:isPlayerGameInitiator={_isPlayerGameInitiator}
    bind:gameInitiatorPlayerName={_gameInitiatorPlayerName}
    bind:playerName={_playerName}
    bind:playerPosition={_playerPosition}
    bind:eventSource
  />
{/if}
