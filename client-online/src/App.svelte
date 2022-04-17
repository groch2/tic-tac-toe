<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import GameBoard from './components/game-board.svelte'
  import GameHub from './components/game-hub.svelte'
  import { BoardComponentOrigin } from './custom-types'
  import type { CreateGameEvent } from './custom-events/create-game'
  import type { JoinGameEvent } from './custom-events/join-game'

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

  function playerLogin(event: CustomEvent) {
    const playerName = event.detail['player-name'] as string
    console.log(`player logged-in: "${playerName}"`)
  }

  function createGame({
    detail: {
      'initiator-player-name': initiatorPlayerName,
      'initiator-player-position': initiatorPlayerPosition,
    },
  }: CustomEvent<CreateGameEvent>) {
    closeEventSource()
    console.debug(`creating new game by player: "${initiatorPlayerName}"`)
    visibleComponent = VisibleComponent.Board
    boardComponentOrigin = BoardComponentOrigin.CreateNewGame
    eventSource = new EventSource(
      `http://localhost:3000/create-game?initiator-player-name=${initiatorPlayerName}&initiator-player-position=${initiatorPlayerPosition}`
    )
    eventSource.onopen = () => {
      console.log('event source opened')
    }
    eventSource.onerror = () => {
      console.log(`event source error`)
    }
    gameBoard.bindToGameBeginningEvent(eventSource)
    gameBoard.bindToPlayGameEvent(eventSource)
    gameBoard.bindToEndOfGameEvent(eventSource)
    _gameInitiatorPlayerName = initiatorPlayerName
    _playerName = _gameInitiatorPlayerName
  }

  function joinGame({
    detail: {
      'game-name': gameName,
      'player-name': playerName,
      'player-position': playerPosition,
    },
  }: CustomEvent<JoinGameEvent>) {
    closeEventSource()
    console.log(`player has joined a game: "${gameName}"`)
    visibleComponent = VisibleComponent.Board
    boardComponentOrigin = BoardComponentOrigin.JoinExistingGame
    eventSource = new EventSource(
      `http://localhost:3000/join-game?game-name=${gameName}&player-name=${playerName}&player-position=${playerPosition}`
    )
    eventSource.onopen = () => {
      console.log('event source opened')
    }
    eventSource.onerror = () => {
      console.log(`event source error`)
    }
    gameBoard.bindToPlayGameEvent(eventSource)
    gameBoard.bindToEndOfGameEvent(eventSource)
    _gameInitiatorPlayerName = playerName
  }

  function closeEventSource() {
    eventSource?.close()
  }

  function quitGameEventHandler() {
    visibleComponent = VisibleComponent.Hub
  }
  onMount(() => {
    document.addEventListener('quit-game', quitGameEventHandler)
  })
  onDestroy(() => {
    document.removeEventListener('quit-game', quitGameEventHandler)
    closeEventSource()
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
