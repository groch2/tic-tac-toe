<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import type { CreateGameRequest } from '../../server/create-game-request'
  import type { GameBeginningEvent } from '../../server/game-beginning-event'
  import type { JoinGameRequest } from '../../server/join-game-request'
  import GameBoard from './components/game-board.svelte'
  import GameHub from './components/game-hub.svelte'
  import type { CreateGameEvent } from './custom-events/create-game'
  import type { JoinGameEvent } from './custom-events/join-game'
  import type { PlayerLoginEvent } from './custom-events/player-login'
  import { BoardComponentDisplayCause } from './custom-types'

  let boardComponentDisplayCause: BoardComponentDisplayCause = null
  let eventSource: EventSource
  let activeGameComponent: typeof GameHub | typeof GameBoard = GameHub
  let _gameInitiatorPlayerName: string = null
  let _playerName: string = null

  function playerLogin({
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
    eventSource.onmessage = (eventMessage) => {
      console.debug({ 'event-source-message': eventMessage })
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

  function createGame({
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
        boardComponentDisplayCause = BoardComponentDisplayCause.CreateNewGame
        _gameInitiatorPlayerName = gameInitiatorPlayerName
        _playerName = _gameInitiatorPlayerName
        activeGameComponent = GameBoard
      })
      .catch((error) => {
        console.error('Error:', error)
      })
  }

  function joinGame({
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
        boardComponentDisplayCause = BoardComponentDisplayCause.JoinExistingGame
        _gameInitiatorPlayerName = gameInitiatorPlayerName
        _playerName = joiningPlayerName
        activeGameComponent = GameBoard
      })
      .catch((error) => {
        console.error('Error:', error)
      })
  }

  function quitGameEventHandler() {
    activeGameComponent = GameHub
  }
  onMount(() => {
    document.addEventListener('quit-game', quitGameEventHandler)
  })
  onDestroy(() => {
    document.removeEventListener('quit-game', quitGameEventHandler)
    eventSource?.close()
  })
</script>

<svelte:component
  this={activeGameComponent}
  on:player-login={playerLogin}
  on:create-game={createGame}
  on:join-game={joinGame}
  on:quit-game={quitGameEventHandler}
  bind:boardComponentDisplayCause
  bind:playerName={_playerName}
  bind:gameInitiatorPlayerName={_gameInitiatorPlayerName}
  bind:eventSource
/>
