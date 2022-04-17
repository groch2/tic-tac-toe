<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import type { CreateGameRequest } from '../../server/create-game-request'
  import type { JoinGameRequest } from '../../server/join-game-request'
  import GameBoard from './components/game-board.svelte'
  import GameHub from './components/game-hub.svelte'
  import type { CreateGameEvent } from './custom-events/create-game'
  import type { JoinGameEvent } from './custom-events/join-game'
  import type { PlayerLoginEvent } from './custom-events/player-login'
  import { BoardComponentOrigin } from './custom-types'

  enum VisibleComponent {
    Hub,
    Board,
  }
  let visibleComponent = VisibleComponent.Hub
  let boardComponentOrigin: BoardComponentOrigin = null
  let eventSource: EventSource
  let gameBoard: GameBoard
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
      'initiator-player-name': initiatorPlayerName,
      'initiator-player-position': initiatorPlayerPosition,
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
        'initiator-player-name': initiatorPlayerName,
        'initiator-player-position': initiatorPlayerPosition,
      } as CreateGameRequest),
    })
      .then((response) => {
        console.log({
          'create-game-response': {
            'response-status': response.status,
            'status-text': response.statusText,
          },
        })
        visibleComponent = VisibleComponent.Board
        boardComponentOrigin = BoardComponentOrigin.CreateNewGame
        gameBoard.bindToGameBeginningEvent(eventSource)
        gameBoard.bindToPlayGameEvent(eventSource)
        gameBoard.bindToEndOfGameEvent(eventSource)
        _gameInitiatorPlayerName = initiatorPlayerName
        _playerName = _gameInitiatorPlayerName
      })
      .catch((error) => {
        console.error('Error:', error)
      })
  }

  function joinGame({
    detail: {
      'initiator-player-name': initiatorPlayerName,
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
        'game-initiator-player-name': initiatorPlayerName,
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
        visibleComponent = VisibleComponent.Board
        boardComponentOrigin = BoardComponentOrigin.JoinExistingGame
        gameBoard.bindToPlayGameEvent(eventSource)
        gameBoard.bindToEndOfGameEvent(eventSource)
        _gameInitiatorPlayerName = initiatorPlayerName
      })
      .catch((error) => {
        console.error('Error:', error)
      })
  }

  function quitGameEventHandler() {
    visibleComponent = VisibleComponent.Hub
  }
  onMount(() => {
    document.addEventListener('quit-game', quitGameEventHandler)
  })
  onDestroy(() => {
    document.removeEventListener('quit-game', quitGameEventHandler)
    eventSource?.close()
  })
</script>

<main>
  <div
    style="display:{visibleComponent === VisibleComponent.Hub
      ? 'initial'
      : 'none'}"
  >
    <GameHub
      on:player-login={playerLogin}
      on:create-game={createGame}
      on:join-game={joinGame}
    />
  </div>
  <div
    style="display:{visibleComponent === VisibleComponent.Board
      ? 'initial'
      : 'none'}"
  >
    <GameBoard
      bind:this={gameBoard}
      bind:boardComponentOrigin
      bind:playerName={_playerName}
      bind:gameInitiatorPlayerName={_gameInitiatorPlayerName}
      on:quit-game={quitGameEventHandler}
    />
  </div>
</main>
