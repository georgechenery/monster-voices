const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

// Serve client in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// ---- Game State ----
const rooms = {}; // roomCode -> roomState

const QUOTE_COUNT = 112

const MONSTER_COUNT = 308

// Pick 9 distinct monster indices that haven't been used in this game yet.
// Tracks across rounds so no monster repeats within a full game session.
function pickMonstersForRound(room) {
  const available = []
  for (let i = 0; i < MONSTER_COUNT; i++) {
    if (!room.usedMonsterIndices.has(i)) available.push(i)
  }
  // Safety reset if somehow the pool runs dry (34+ rounds)
  if (available.length < 9) {
    room.usedMonsterIndices = new Set()
    return shuffle(Array.from({ length: MONSTER_COUNT }, (_, i) => i)).slice(0, 9)
  }
  const picked = shuffle(available).slice(0, 9)
  picked.forEach(i => room.usedMonsterIndices.add(i))
  return picked
}

// Colors assigned to spotters in gauntlet mode
const SPOTTER_COLORS = [
  '#e74c3c', // red
  '#3498db', // blue
  '#27ae60', // green
  '#f39c12', // amber
  '#8e44ad', // purple
  '#16a085', // teal
  '#d35400', // orange
  '#e91e63', // pink
];

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getNextQuote(room) {
  if (!room.quoteDeck || room.quoteDeck.length === 0) {
    let deck = shuffle(Array.from({ length: QUOTE_COUNT }, (_, i) => i));
    // Avoid the same card appearing twice in a row across cycles
    if (room.lastQuote != null && deck[0] === room.lastQuote) {
      const swapIdx = 1 + Math.floor(Math.random() * (deck.length - 1));
      [deck[0], deck[swapIdx]] = [deck[swapIdx], deck[0]];
    }
    room.quoteDeck = deck;
  }
  const quote = room.quoteDeck.shift();
  room.lastQuote = quote;
  return quote;
}

const AVATAR_COUNT = 11;

function createPlayer(id, name, isHost = false, avatarId = 0) {
  return { id, name, isHost, score: 0, avatarId };
}

// ---- Classic Mode ----

function startRound(room) {
  const { players, spotterIndex } = room;
  const spotter = players[spotterIndex];

  // Pick 9 unique monsters not yet used this game; assign to grid positions
  const shuffledMonsters = pickMonstersForRound(room);

  // Non-spotter players get positions
  const nonSpotters = players.filter(p => p.id !== spotter.id);

  const positions = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  const assignments = {}; // playerId -> { position, monsterIndex }
  nonSpotters.forEach((player, idx) => {
    const position = positions[idx];
    const monsterIndex = shuffledMonsters[position];
    assignments[player.id] = { position, monsterIndex };
  });

  // Speaking order: start left of spotter (next in circle)
  const speakingOrder = [];
  const spotterIdx = spotterIndex;
  for (let i = 1; i < players.length; i++) {
    const idx = (spotterIdx + i) % players.length;
    speakingOrder.push(players[idx].id);
  }

  const quote = getNextQuote(room);

  room.round = {
    spotterId: spotter.id,
    shuffledMonsters,
    assignments,
    speakingOrder,
    secondChancePlayers: [],
    currentSpeakerIdx: 0,
    guessedCorrectly: {},
    phase: 'speaking', // 'speaking' | 'second_chance' | 'ended'
    quote,
    secondQuote: null,
    wagers: {},          // playerId -> position they wagered on
    peekedPlayers: new Set(), // players who received a peek this round
  };

  room.phase = 'playing';
}

function advanceSpeaker(room, io) {
  const round = room.round;
  round.wagers = {}; // clear wagers for next speaker turn

  if (round.phase === 'speaking') {
    round.currentSpeakerIdx++;

    if (round.currentSpeakerIdx >= round.speakingOrder.length) {
      const secondChancePlayers = round.speakingOrder.filter(
        pid => !round.guessedCorrectly[pid]
      );

      if (secondChancePlayers.length > 0) {
        round.phase = 'second_chance';
        round.secondChancePlayers = secondChancePlayers;
        round.currentSpeakerIdx = 0;
        round.secondQuote = getNextQuote(room);

        io.to(room.code).emit('second_chance_started', {
          quote: round.secondQuote,
          secondChancePlayers
        });

        const nextSpeakerId = secondChancePlayers[round.currentSpeakerIdx];
        const nextSpeaker = room.players.find(p => p.id === nextSpeakerId);
        io.to(nextSpeakerId).emit('your_turn', { quote: round.secondQuote });

        io.to(room.code).emit('speaker_changed', {
          currentSpeakerId: nextSpeakerId,
          speakerName: nextSpeaker ? nextSpeaker.name : 'Unknown'
        });
      } else {
        endRound(room, io);
      }
    } else {
      const nextSpeakerId = round.speakingOrder[round.currentSpeakerIdx];
      const nextSpeaker = room.players.find(p => p.id === nextSpeakerId);
      io.to(nextSpeakerId).emit('your_turn', { quote: round.quote });

      io.to(room.code).emit('speaker_changed', {
        currentSpeakerId: nextSpeakerId,
        speakerName: nextSpeaker ? nextSpeaker.name : 'Unknown'
      });
    }
  } else if (round.phase === 'second_chance') {
    round.currentSpeakerIdx++;

    if (round.currentSpeakerIdx >= round.secondChancePlayers.length) {
      endRound(room, io);
    } else {
      const nextSpeakerId = round.secondChancePlayers[round.currentSpeakerIdx];
      const nextSpeaker = room.players.find(p => p.id === nextSpeakerId);
      io.to(nextSpeakerId).emit('your_turn', { quote: round.secondQuote });

      io.to(room.code).emit('speaker_changed', {
        currentSpeakerId: nextSpeakerId,
        speakerName: nextSpeaker ? nextSpeaker.name : 'Unknown'
      });
    }
  }
}

function endRound(room, io) {
  const round = room.round;
  round.phase = 'ended';
  room.phase = 'results';

  const reveals = round.speakingOrder.map(pid => {
    const player = room.players.find(p => p.id === pid);
    const assignment = round.assignments[pid];
    return {
      playerId: pid,
      playerName: player ? player.name : 'Unknown',
      position: assignment.position,
      monsterIndex: assignment.monsterIndex,
      guessed: !!round.guessedCorrectly[pid]
    };
  });

  const scores = room.players.map(p => ({ id: p.id, name: p.name, score: p.score, avatarId: p.avatarId }));

  io.to(room.code).emit('round_ended', { reveals, scores });

  room.roundsPlayed++;
  if (room.roundsPlayed >= room.totalRounds) {
    const sortedScores = [...scores].sort((a, b) => b.score - a.score);
    const winner = sortedScores[0];
    io.to(room.code).emit('game_over', { winner, finalScores: sortedScores });
    room.phase = 'game_over';
  }
}

// ---- Gauntlet Mode ----

function startGauntlet(room, pigId) {
  const shuffledMonsters = pickMonstersForRound(room);
  const monsterOrder = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]); // order of positions PIG portrays

  const spotters = room.players.filter(p => p.id !== pigId);
  const playerColors = {};
  spotters.forEach((p, i) => {
    playerColors[p.id] = SPOTTER_COLORS[i % SPOTTER_COLORS.length];
  });

  const currentPosition = monsterOrder[0];
  const currentMonsterIndex = shuffledMonsters[currentPosition];
  const quote = getNextQuote(room);

  room.gauntlet = {
    pigId,
    shuffledMonsters,
    monsterOrder,
    currentOrderIdx: 0,
    currentPosition,
    currentMonsterIndex,
    quote,
    solvedPositions: [],
    strikes: 0,
    phase: 'speaking', // 'speaking' | 'voting' | 'result' | 'finished'
    votes: {},
    playerColors,
    attemptCount: 0,
  };

  room.phase = 'playing';
}

function tallyGauntletVotes(room, io) {
  const gauntlet = room.gauntlet;
  if (gauntlet.phase !== 'voting') return;
  gauntlet.phase = 'result';

  // Count votes per position
  const voteCounts = {};
  Object.values(gauntlet.votes).forEach(pos => {
    voteCounts[pos] = (voteCounts[pos] || 0) + 1;
  });

  if (Object.keys(voteCounts).length === 0) return;

  const maxVotes = Math.max(...Object.values(voteCounts));
  const tiedPositions = Object.keys(voteCounts)
    .filter(pos => voteCounts[pos] === maxVotes)
    .map(Number);

  const tieBreak = tiedPositions.length > 1;
  const guessedPosition = tiedPositions[Math.floor(Math.random() * tiedPositions.length)];

  const correct = guessedPosition === gauntlet.currentPosition;

  if (correct) {
    gauntlet.solvedPositions.push(gauntlet.currentPosition);
  } else {
    gauntlet.strikes++;
  }

  io.to(room.code).emit('gauntlet_result', {
    correct,
    position: gauntlet.currentPosition,
    monsterIndex: gauntlet.currentMonsterIndex,
    guessedPosition,
    strikes: gauntlet.strikes,
    solvedPositions: [...gauntlet.solvedPositions],
    tieBreak,
    tiedPositions,
  });

  // After showing result, advance game state
  setTimeout(() => {
    if (gauntlet.strikes >= 5) {
      // Team loses — too many strikes
      gauntlet.phase = 'finished';
      room.phase = 'game_over';
      io.to(room.code).emit('gauntlet_finished', {
        outcome: 'lose',
        strikes: gauntlet.strikes,
        isPerfect: false,
        solvedCount: gauntlet.solvedPositions.length,
      });
    } else if (gauntlet.solvedPositions.length >= 9) {
      // Team wins — all 9 guessed
      gauntlet.phase = 'finished';
      room.phase = 'game_over';
      io.to(room.code).emit('gauntlet_finished', {
        outcome: 'win',
        strikes: gauntlet.strikes,
        isPerfect: gauntlet.strikes === 0,
        solvedCount: 9,
      });
    } else if (correct) {
      // Correct — advance to next monster
      gauntlet.currentOrderIdx++;
      gauntlet.currentPosition = gauntlet.monsterOrder[gauntlet.currentOrderIdx];
      gauntlet.currentMonsterIndex = gauntlet.shuffledMonsters[gauntlet.currentPosition];
      const newQuote = getNextQuote(room);
      gauntlet.quote = newQuote;
      gauntlet.phase = 'speaking';
      gauntlet.votes = {};
      gauntlet.attemptCount = 0;

      io.to(room.code).emit('gauntlet_next_monster', {
        quote: newQuote,
        monstersLeft: 9 - gauntlet.solvedPositions.length,
      });

      // Tell PIG their new monster privately (reusing 'your_monster' event)
      io.to(gauntlet.pigId).emit('your_monster', {
        position: gauntlet.currentPosition,
        monsterIndex: gauntlet.currentMonsterIndex,
      });
    } else {
      // Wrong — retry same monster with new quote
      const newQuote = getNextQuote(room);
      gauntlet.quote = newQuote;
      gauntlet.phase = 'speaking';
      gauntlet.votes = {};
      gauntlet.attemptCount++;

      io.to(room.code).emit('gauntlet_retry', {
        newQuote,
        strikes: gauntlet.strikes,
        monstersLeft: 9 - gauntlet.solvedPositions.length,
      });
    }
  }, 3000);
}

// ---- Socket.io ----
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('create_room', ({ playerName }) => {
    let code;
    do {
      code = generateRoomCode();
    } while (rooms[code]);

    const player = createPlayer(socket.id, playerName, true, 0);
    rooms[code] = {
      code,
      hostId: socket.id,
      players: [player],
      phase: 'waiting',
      mode: 'classic', // 'classic' | 'gauntlet'
      pendingPigId: null,
      spotterIndex: 0,
      roundsPlayed: 0,
      totalRounds: 0,
      round: null,
      gauntlet: null,
      usedMonsterIndices: new Set(),
      voiceChat: false,
      voicePeers: new Set(),
    };

    socket.join(code);
    socket.data.roomCode = code;
    socket.data.playerName = playerName;

    socket.emit('room_created', { roomCode: code, player, players: [player], voiceChat: false });
    console.log(`Room created: ${code} by ${playerName}`);
  });

  socket.on('join_room', ({ roomCode, playerName }) => {
    const code = roomCode.toUpperCase().trim();
    const room = rooms[code];

    if (!room) {
      socket.emit('error', { message: 'Room not found. Check your code and try again.' });
      return;
    }
    if (room.phase !== 'waiting') {
      // Allow joining a classic game already in progress
      if ((room.phase === 'playing' || room.phase === 'results') && room.mode === 'classic') {
        if (room.players.length >= 10) {
          socket.emit('error', { message: 'Room is full (max 10 players).' });
          return;
        }

        const takenIds = new Set(room.players.map(p => p.avatarId));
        let avatarId = 0;
        for (let i = 0; i < AVATAR_COUNT; i++) {
          if (!takenIds.has(i)) { avatarId = i; break; }
        }

        const player = createPlayer(socket.id, playerName, false, avatarId);
        player.midgameJoin = true;
        room.players.push(player);

        socket.join(code);
        socket.data.roomCode = code;
        socket.data.playerName = playerName;

        // Send enough state for the client to show the current round
        const round = room.round;
        const currentSpeakerId = round
          ? (round.phase === 'second_chance'
              ? round.secondChancePlayers[round.currentSpeakerIdx]
              : round.speakingOrder[round.currentSpeakerIdx])
          : null;

        socket.emit('joined_midgame', {
          roomCode: code,
          player,
          players: room.players,
          scores: room.players.map(p => ({ id: p.id, name: p.name, score: p.score, avatarId: p.avatarId })),
          roundState: round ? {
            spotterId: round.spotterId,
            shuffledMonsters: round.shuffledMonsters,
            currentSpeakerId,
            speakingOrder: round.speakingOrder,
            phase: round.phase,
          } : null,
        });

        socket.to(code).emit('player_joined', { players: room.players });
        console.log(`${playerName} joined room ${code} mid-game`);
        return;
      }

      socket.emit('error', { message: 'Game already in progress.' });
      return;
    }
    if (room.players.length >= 10) {
      socket.emit('error', { message: 'Room is full (max 10 players).' });
      return;
    }

    const takenIds = new Set(room.players.map(p => p.avatarId));
    let avatarId = 0;
    for (let i = 0; i < AVATAR_COUNT; i++) {
      if (!takenIds.has(i)) { avatarId = i; break; }
    }
    const player = createPlayer(socket.id, playerName, false, avatarId);
    room.players.push(player);

    socket.join(code);
    socket.data.roomCode = code;
    socket.data.playerName = playerName;

    socket.emit('room_joined', {
      roomCode: code,
      player,
      players: room.players,
      mode: room.mode,
      pendingPigId: room.pendingPigId,
      voiceChat: room.voiceChat,
    });
    socket.to(code).emit('player_joined', { players: room.players });
    console.log(`${playerName} joined room ${code}`);
  });

  // Host toggles voice chat mode while in waiting room
  socket.on('set_voice_mode', ({ voiceChat }) => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room || socket.id !== room.hostId) return;
    room.voiceChat = !!voiceChat;
    io.to(code).emit('voice_mode_updated', { voiceChat: room.voiceChat });
  });

  // Host changes game mode while in waiting room
  socket.on('set_mode', ({ mode, pigId }) => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room || socket.id !== room.hostId) return;

    room.mode = mode || 'classic';
    room.pendingPigId = pigId || null;

    io.to(code).emit('mode_updated', { mode: room.mode, pigId: room.pendingPigId });
  });

  socket.on('start_game', ({ mode, pigId } = {}) => {
    const code = socket.data.roomCode;
    const room = rooms[code];

    if (!room) return;
    if (socket.id !== room.hostId) {
      socket.emit('error', { message: 'Only the host can start the game.' });
      return;
    }

    const gameMode = mode || room.mode || 'classic';

    if (gameMode === 'gauntlet') {
      if (room.players.length < 2) {
        socket.emit('error', { message: 'Need at least 2 players for Run the Gauntlet.' });
        return;
      }

      room.mode = 'gauntlet';
      const resolvedPigId = pigId || room.pendingPigId || room.hostId;
      startGauntlet(room, resolvedPigId);
      const g = room.gauntlet;

      io.to(code).emit('gauntlet_started', {
        pigId: g.pigId,
        shuffledMonsters: g.shuffledMonsters,
        quote: g.quote,
        playerColors: g.playerColors,
        players: room.players,
        strikes: 0,
        solvedPositions: [],
      });

      // Tell PIG their first monster privately (reusing 'your_monster')
      io.to(g.pigId).emit('your_monster', {
        position: g.currentPosition,
        monsterIndex: g.currentMonsterIndex,
      });

      console.log(`Gauntlet started in room ${code}, PIG: ${g.pigId}`);
    } else {
      // Classic mode
      if (room.players.length < 3) {
        socket.emit('error', { message: 'Need at least 3 players to start.' });
        return;
      }

      room.mode = 'classic';
      room.totalRounds = room.players.length;
      room.spotterIndex = 0;
      room.roundsPlayed = 0;

      startRound(room);
      const round = room.round;

      io.to(code).emit('game_started', {
        spotterId: round.spotterId,
        shuffledMonsters: round.shuffledMonsters,
        quote: round.quote,
        speakingOrder: round.speakingOrder,
        players: room.players,
        voiceChat: room.voiceChat,
      });

      round.speakingOrder.forEach(pid => {
        const assignment = round.assignments[pid];
        io.to(pid).emit('your_monster', {
          position: assignment.position,
          monsterIndex: assignment.monsterIndex
        });
      });

      const firstSpeakerId = round.speakingOrder[0];
      io.to(firstSpeakerId).emit('your_turn', { quote: round.quote });

      console.log(`Classic game started in room ${code}`);
    }
  });

  socket.on('speaker_ready', () => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room) return;

    // Broadcast to all other players so they initiate WebRTC to speaker
    socket.to(code).emit('connect_to_speaker', { speakerId: socket.id });
  });

  socket.on('done_speaking', () => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room) return;

    if (room.mode === 'gauntlet') {
      const gauntlet = room.gauntlet;
      if (!gauntlet || gauntlet.phase !== 'speaking') return;
      if (socket.id !== gauntlet.pigId) return;

      gauntlet.phase = 'voting';
      gauntlet.votes = {};
      io.to(code).emit('gauntlet_voting_open', {});
    } else {
      // Classic mode
      if (!room.round) return;
      const round = room.round;

      let expectedSpeaker;
      if (round.phase === 'speaking') {
        expectedSpeaker = round.speakingOrder[round.currentSpeakerIdx];
      } else if (round.phase === 'second_chance') {
        expectedSpeaker = round.secondChancePlayers[round.currentSpeakerIdx];
      }

      if (socket.id !== expectedSpeaker) return;
      io.to(code).emit('waiting_for_guess', {});
      if (room.voiceChat) io.to(code).emit('voice_mute_all', {});
    }
  });

  socket.on('make_guess', ({ position }) => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room || !room.round) return;

    const round = room.round;

    if (socket.id !== round.spotterId) return;

    let currentSpeakerId;
    let isSecondChance = false;
    if (round.phase === 'speaking') {
      currentSpeakerId = round.speakingOrder[round.currentSpeakerIdx];
    } else if (round.phase === 'second_chance') {
      currentSpeakerId = round.secondChancePlayers[round.currentSpeakerIdx];
      isSecondChance = true;
    } else {
      return;
    }

    const assignment = round.assignments[currentSpeakerId];
    const correct = assignment.position === position;
    const speaker = room.players.find(p => p.id === currentSpeakerId);

    let pointsAwarded = 0;
    if (correct) {
      const pts = isSecondChance ? 1 : 2;
      pointsAwarded = pts;
      const spotterPlayer = room.players.find(p => p.id === round.spotterId);
      if (spotterPlayer) spotterPlayer.score += pts;
      if (speaker) speaker.score += pts;
      round.guessedCorrectly[currentSpeakerId] = true;
    }

    // Settle wagers
    const correctPosition = assignment.position;
    const wagerOutcomes = []; // non-zero outcomes broadcast to room
    for (const [wagerId, wageredPosition] of Object.entries(round.wagers)) {
      const wagerer = room.players.find(p => p.id === wagerId);
      if (!wagerer) continue;
      let delta = 0;
      if (wageredPosition === position) {
        delta = 0; // same as spotter: refund
      } else if (wageredPosition === correctPosition) {
        delta = 1; // right, spotter wrong: win
      } else {
        delta = -1; // wrong: lose
      }
      wagerer.score += delta;
      io.to(wagerId).emit('wager_result', { delta, wageredPosition, correctPosition, spotterPosition: position });
      if (delta !== 0) {
        wagerOutcomes.push({ playerName: wagerer.name, delta });
      }
    }
    round.wagers = {};

    const scores = room.players.map(p => ({ id: p.id, name: p.name, score: p.score, avatarId: p.avatarId }));

    io.to(code).emit('guess_result', {
      correct,
      speakerId: currentSpeakerId,
      speakerName: speaker ? speaker.name : 'Unknown',
      position: assignment.position,
      monsterIndex: assignment.monsterIndex,
      guessedPosition: position,
      points: pointsAwarded,
      isSecondChance,
      wagerOutcomes,
      scores
    });

    setTimeout(() => {
      advanceSpeaker(room, io);
    }, 3000);
  });

  socket.on('select_avatar', ({ avatarId }) => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room || room.phase !== 'waiting') return;
    const taken = room.players.find(p => p.id !== socket.id && p.avatarId === avatarId);
    if (taken) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    player.avatarId = avatarId;
    io.to(code).emit('avatar_updated', { playerId: socket.id, avatarId });
  });

  // Speaker started recording — broadcast so others can show "Speaking" status
  socket.on('speaker_recording', () => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room || !room.round) return;
    socket.to(code).emit('speaker_recording');
  });

  // Spotter timed out — skip the guess and advance
  socket.on('skip_guess', () => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room || !room.round) return;
    const round = room.round;
    if (socket.id !== round.spotterId) return;
    if (round.phase !== 'speaking' && round.phase !== 'second_chance') return;

    io.to(code).emit('guess_skipped');
    setTimeout(() => {
      advanceSpeaker(room, io);
    }, 1500);
  });

  // Gauntlet: spotter casts a vote
  socket.on('gauntlet_vote', ({ position }) => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room || !room.gauntlet) return;

    const gauntlet = room.gauntlet;
    if (gauntlet.phase !== 'voting') return;
    if (socket.id === gauntlet.pigId) return; // PIG can't vote

    gauntlet.votes[socket.id] = position;

    io.to(code).emit('gauntlet_vote_update', { votes: { ...gauntlet.votes } });

    // Check if all spotters have voted
    const spotters = room.players.filter(p => p.id !== gauntlet.pigId);
    const allVoted = spotters.every(p => gauntlet.votes[p.id] !== undefined);

    if (allVoted) {
      setTimeout(() => tallyGauntletVotes(room, io), 1500);
    }
  });

  socket.on('webrtc_signal', ({ targetId, signal }) => {
    io.to(targetId).emit('webrtc_signal', { fromId: socket.id, signal });
  });

  // Voice chat mesh signaling (separate from speaker WebRTC)
  socket.on('voice_signal', ({ targetId, signal }) => {
    io.to(targetId).emit('voice_signal', { fromId: socket.id, signal });
  });

  // Player clicks "Join Voice" — tell them who's already in, tell others they joined
  socket.on('voice_joined', () => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    console.log(`[Voice] voice_joined from ${socket.id}, room=${code}, voiceChat=${room?.voiceChat}`);
    if (!room || !room.voiceChat) return;
    const currentPeers = [...room.voicePeers];
    room.voicePeers.add(socket.id);
    console.log(`[Voice] sending current_peers=${JSON.stringify(currentPeers)}, broadcasting peer_joined to room`);
    socket.emit('voice_current_peers', { peers: currentPeers });
    socket.to(code).emit('voice_peer_joined', { peerId: socket.id });
  });

  socket.on('ask_peek', () => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room || !room.round) return;
    const round = room.round;

    const currentSpeakerId = round.phase === 'second_chance'
      ? round.secondChancePlayers[round.currentSpeakerIdx]
      : round.speakingOrder[round.currentSpeakerIdx];
    if (socket.id === round.spotterId || socket.id === currentSpeakerId) return;

    const requester = room.players.find(p => p.id === socket.id);
    if (!requester) return;

    io.to(currentSpeakerId).emit('peek_request', {
      requesterId: socket.id,
      requesterName: requester.name
    });
  });

  socket.on('peek_response', ({ requesterId, granted }) => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room || !room.round) return;
    const round = room.round;

    const assignment = round.assignments[socket.id];
    const speaker = room.players.find(p => p.id === socket.id);
    if (!assignment || !speaker) return;

    if (granted) {
      round.peekedPlayers.add(requesterId);
      io.to(requesterId).emit('peek_granted', {
        monsterIndex: assignment.monsterIndex,
        speakerName: speaker.name
      });
    } else {
      io.to(requesterId).emit('peek_denied', { speakerName: speaker.name });
    }
  });

  socket.on('place_wager', ({ position }) => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room || !room.round) return;
    const round = room.round;

    // Only audience players can wager (not spotter, not current speaker)
    const currentSpeakerId = round.phase === 'second_chance'
      ? round.secondChancePlayers[round.currentSpeakerIdx]
      : round.speakingOrder[round.currentSpeakerIdx];
    if (socket.id === round.spotterId || socket.id === currentSpeakerId) return;

    // Disallow if player has peeked this round
    if (round.peekedPlayers.has(socket.id)) {
      socket.emit('wager_rejected', { reason: 'peeked' });
      return;
    }

    // Disallow if already wagered this turn
    if (round.wagers[socket.id] !== undefined) {
      socket.emit('wager_rejected', { reason: 'already_placed' });
      return;
    }

    // Validate position
    if (typeof position !== 'number' || position < 0 || position > 8) return;

    round.wagers[socket.id] = position;
    socket.emit('wager_confirmed', { position });
  });

  socket.on('audio_upload', ({ audioData, mimeType }) => {
    const code = socket.data.roomCode;
    if (!code || !rooms[code]) return;
    io.to(code).emit('audio_ready', { audioData, mimeType, speakerId: socket.id });
  });

  socket.on('start_next_round', () => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room) return;
    if (socket.id !== room.hostId) return;
    if (room.phase !== 'results') return;

    // Promote any mid-game joiners to full participants and give them a spotter turn each
    const midgameJoiners = room.players.filter(p => p.midgameJoin);
    midgameJoiners.forEach(p => {
      delete p.midgameJoin;
      room.totalRounds++;
    });

    room.spotterIndex = (room.spotterIndex + 1) % room.players.length;

    startRound(room);
    const round = room.round;

    io.to(code).emit('game_started', {
      spotterId: round.spotterId,
      shuffledMonsters: round.shuffledMonsters,
      quote: round.quote,
      speakingOrder: round.speakingOrder,
      players: room.players
    });

    round.speakingOrder.forEach(pid => {
      const assignment = round.assignments[pid];
      io.to(pid).emit('your_monster', {
        position: assignment.position,
        monsterIndex: assignment.monsterIndex
      });
    });

    const firstSpeakerId = round.speakingOrder[0];
    io.to(firstSpeakerId).emit('your_turn', { quote: round.quote });

    console.log(`Next round started in room ${code}`);
  });

  socket.on('emote', ({ emoteId }) => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    const valid = ['cheer', 'laugh', 'shocked', 'boo', 'love', 'think'];
    if (!valid.includes(emoteId)) return;
    io.to(code).emit('emote', {
      playerId: socket.id,
      playerName: player.name,
      avatarId: player.avatarId,
      emoteId,
    });
  });

  socket.on('chat_message', ({ text }) => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    const trimmed = (text || '').toString().trim().slice(0, 200);
    if (!trimmed) return;
    io.to(code).emit('chat_message', {
      playerId: socket.id,
      playerName: player.name,
      avatarId: player.avatarId,
      text: trimmed,
      ts: Date.now(),
    });
  });

  socket.on('disconnect', () => {
    const code = socket.data.roomCode;
    if (!code || !rooms[code]) return;

    const room = rooms[code];
    const leavingName = socket.data.playerName;
    room.players = room.players.filter(p => p.id !== socket.id);
    room.voicePeers?.delete(socket.id);

    if (room.players.length === 0) {
      delete rooms[code];
      console.log(`Room ${code} deleted (empty)`);
      return;
    }

    let newHostId = null;
    if (socket.id === room.hostId) {
      room.players[0].isHost = true;
      room.hostId = room.players[0].id;
      newHostId = room.hostId;
    }

    // Handle mid-round disconnect in classic mode
    if (room.phase === 'playing' && room.mode === 'classic' && room.round && room.round.phase !== 'ended') {
      const round = room.round;

      if (socket.id === round.spotterId) {
        // Spotter left — end the round immediately
        io.to(code).emit('player_left', { players: room.players, newHostId });
        io.to(code).emit('notification', {
          message: `${leavingName} (Spotter) disconnected — round skipped`,
        });
        endRound(room, io);
      } else {
        // Speaker left — remove from all round tracking
        let wasCurrent = false;

        if (round.phase === 'speaking') {
          const idx = round.speakingOrder.indexOf(socket.id);
          if (idx !== -1) {
            wasCurrent = idx === round.currentSpeakerIdx;
            round.speakingOrder.splice(idx, 1);
            if (idx < round.currentSpeakerIdx) round.currentSpeakerIdx--;
          }
        } else if (round.phase === 'second_chance') {
          const scIdx = round.secondChancePlayers.indexOf(socket.id);
          if (scIdx !== -1) {
            wasCurrent = scIdx === round.currentSpeakerIdx;
            round.secondChancePlayers.splice(scIdx, 1);
            if (scIdx < round.currentSpeakerIdx) round.currentSpeakerIdx--;
          }
          round.speakingOrder = round.speakingOrder.filter(pid => pid !== socket.id);
        } else {
          round.speakingOrder = round.speakingOrder.filter(pid => pid !== socket.id);
        }

        delete round.assignments[socket.id];

        io.to(code).emit('player_left', { players: room.players, newHostId });

        if (wasCurrent) {
          io.to(code).emit('notification', {
            message: `${leavingName} disconnected — skipping their turn`,
          });
          round.currentSpeakerIdx--; // advanceSpeaker will increment
          advanceSpeaker(room, io);
        }
      }
    } else {
      io.to(code).emit('player_left', { players: room.players, newHostId });
    }

    console.log(`${leavingName} left room ${code}`);
  });
});

server.listen(PORT, () => {
  console.log(`Monster Voices server running on port ${PORT}`);
});
