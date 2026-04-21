const playPauseButton = document.getElementById("playPauseButton");
const playIcon = document.getElementById("playIcon");
const progressFill = document.getElementById("progressFill");
const progressTrack = document.querySelector(".progress-track");
const currentTimeLabel = document.getElementById("currentTime");
const durationLabel = document.getElementById("duration");
const trackTitle = document.getElementById("trackTitle");
const albumCards = Array.from(document.querySelectorAll(".album-card"));

const PLAY_ICON = "\u25B6";
const PAUSE_ICON = "\u23F8";
const DEFAULT_DURATION_SECONDS = 215;
const MILLISECONDS_IN_SECOND = 1000;

const playerState = {
  durationSeconds: 223,
  isPlaying: false,
  elapsedMs: 0,
  lastRenderedSecond: -1,
  animationFrameId: null,
  startTimestamp: 0,
};

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}

// Keep a single conversion point for smoother and clearer time math.
function totalDurationMs() {
  return playerState.durationSeconds * MILLISECONDS_IN_SECOND;
}

function render() {
  const progressPercent = (playerState.elapsedMs / totalDurationMs()) * 100;
  progressFill.style.width = `${progressPercent}%`;
  progressTrack.setAttribute("aria-valuenow", String(Math.round(progressPercent)));
  progressTrack.setAttribute("aria-valuetext", `${Math.round(progressPercent)} percent played`);

  const currentSecond = Math.floor(playerState.elapsedMs / MILLISECONDS_IN_SECOND);
  if (currentSecond !== playerState.lastRenderedSecond) {
    currentTimeLabel.textContent = formatTime(currentSecond);
    playerState.lastRenderedSecond = currentSecond;
  }
}

function setPlaybackUiState(playing) {
  playIcon.textContent = playing ? PAUSE_ICON : PLAY_ICON;
  playPauseButton.setAttribute("aria-label", playing ? "Pause" : "Play");
  playPauseButton.setAttribute("aria-pressed", String(playing));
  document.body.classList.toggle("is-playing", playing);
}

// Reset playback when a track ends or a new album is selected.
function resetPlayer() {
  cancelAnimationFrame(playerState.animationFrameId);
  playerState.animationFrameId = null;
  playerState.isPlaying = false;
  playerState.elapsedMs = 0;
  playerState.lastRenderedSecond = -1;
  setPlaybackUiState(false);
  render();
}

function tick(timestamp) {
  if (!playerState.isPlaying) {
    return;
  }

  const deltaMs = timestamp - playerState.startTimestamp;
  playerState.elapsedMs = Math.min(deltaMs, totalDurationMs());
  render();

  if (playerState.elapsedMs >= totalDurationMs()) {
    resetPlayer();
    return;
  }

  playerState.animationFrameId = requestAnimationFrame(tick);
}

function togglePlayback() {
  if (playerState.isPlaying) {
    playerState.isPlaying = false;
    cancelAnimationFrame(playerState.animationFrameId);
    playerState.animationFrameId = null;
    setPlaybackUiState(false);
    return;
  }

  playerState.isPlaying = true;
  playerState.startTimestamp = performance.now() - playerState.elapsedMs;
  setPlaybackUiState(true);
  playerState.animationFrameId = requestAnimationFrame(tick);
}

function setSelectedAlbum(card) {
  albumCards.forEach((albumCard) => {
    const isSelected = albumCard === card;
    albumCard.classList.toggle("is-selected", isSelected);
    albumCard.setAttribute("aria-selected", String(isSelected));
    albumCard.tabIndex = isSelected ? 0 : -1;
  });

  const title = card.querySelector("h2")?.textContent?.trim() || "Unknown Track";
  const rawDuration = Number.parseInt(card.dataset.duration || String(DEFAULT_DURATION_SECONDS), 10);
  const safeDuration = Number.isNaN(rawDuration) ? DEFAULT_DURATION_SECONDS : rawDuration;

  trackTitle.textContent = title;
  playerState.durationSeconds = safeDuration;
  durationLabel.textContent = formatTime(playerState.durationSeconds);
  resetPlayer();
}

function handleCardKeydown(event, card) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    setSelectedAlbum(card);
    return;
  }

  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
    event.preventDefault();
    const nextIndex = (albumCards.indexOf(card) + 1) % albumCards.length;
    albumCards[nextIndex].focus();
  }

  if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
    event.preventDefault();
    const previousIndex = (albumCards.indexOf(card) - 1 + albumCards.length) % albumCards.length;
    albumCards[previousIndex].focus();
  }
}

function initializePlayer() {
  albumCards.forEach((card) => {
    card.addEventListener("click", () => setSelectedAlbum(card));
    card.addEventListener("keydown", (event) => handleCardKeydown(event, card));
  });

  playPauseButton.addEventListener("click", togglePlayback);

  const initiallySelectedCard = albumCards.find((card) => card.classList.contains("is-selected")) || albumCards[0];
  setSelectedAlbum(initiallySelectedCard);
  setPlaybackUiState(false);
}

initializePlayer();
