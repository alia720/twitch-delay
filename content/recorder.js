const RECORD_TYPE = 'video/webm;codecs=vp8,opus';
const PLAYBACK_TYPE = 'video/webm; codecs="vp8,opus"';
const RECORD_BITRATE = 6_000_000;
const CHUNK_SECONDS = 1;
const LOOKAHEAD_SECONDS = 30;
const KEEP_SECONDS = 10;
const MAX_SPEED = 2;

let recording = null;

const rootData = () => document.documentElement.dataset;
const elapsed = (rec) => (Date.now() - rec.startedAt) / 1000;
const targetTime = (rec) => elapsed(rec) - rec.delay;

const fill = (element, style) => Object.assign(element.style, { position: 'absolute', inset: '0', ...style });

const createScreen = (source) => {
  const screen = document.createElement('div');
  const video = document.createElement('video');
  const label = document.createElement('p');
  fill(screen, { background: '#000', pointerEvents: 'none', display: 'grid', placeItems: 'center' });
  fill(video, { width: '100%', height: '100%', objectFit: 'contain' });
  Object.assign(label.style, {
    position: 'relative',
    margin: '0',
    padding: '8px 16px',
    borderRadius: '999px',
    background: 'rgba(20, 14, 32, 0.75)',
    color: '#fff',
    font: '600 14px system-ui, sans-serif',
  });
  screen.append(video, label);
  source.after(screen);
  return { screen, overlay: video, label };
};

const silenceSource = (source) => {
  Object.assign(rootData(), { twitchMuted: source.muted, twitchVolume: source.volume, twitchRecording: 'on' });
  source.muted = true;
};

const restoreSource = (source) => {
  const { twitchMuted, twitchVolume } = rootData();
  rootData().twitchRecording = 'off';
  source.volume = Number(twitchVolume);
  source.muted = twitchMuted === 'true';
};

const syncVolume = ({ overlay }) => {
  const { twitchMuted, twitchVolume } = rootData();
  overlay.volume = Number(twitchVolume);
  overlay.muted = twitchMuted === 'true';
};

const waitTime = (rec) => rec.overlay.currentTime - targetTime(rec);

const showLabel = (label, text) => {
  label.hidden = !text;
  label.textContent = text;
};

const skipGap = (overlay) => {
  const { buffered, currentTime, readyState } = overlay;
  if (readyState >= 3) return;
  for (let i = 0; i < buffered.length; i += 1) {
    if (buffered.start(i) > currentTime) {
      overlay.currentTime = buffered.start(i);
      return;
    }
  }
};

const steer = (rec) => {
  const { overlay, label } = rec;
  const wait = waitTime(rec);
  if (wait > 0.5) {
    overlay.pause();
    showLabel(label, wait > 2 ? `Playback starts in ${formatClock(wait)}` : '');
    return;
  }

  showLabel(label, '');
  skipGap(overlay);
  overlay.playbackRate = Math.min(MAX_SPEED, Math.max(1, 1 - wait / 10));
  if (overlay.paused) overlay.play().catch(() => {});
};

const appendNext = async (rec) => {
  rec.busy = true;
  const chunk = rec.chunks[rec.next];
  rec.chunks[rec.next] = null;
  rec.next += 1;
  const data = await chunk.arrayBuffer();
  if (recording === rec) rec.buffer.appendBuffer(data);
  rec.busy = false;
};

const trimPlayed = ({ overlay, buffer }) => {
  const { buffered, currentTime } = overlay;
  if (buffered.length && buffered.start(0) < currentTime - KEEP_SECONDS * 2) buffer.remove(0, currentTime - KEEP_SECONDS);
};

const feed = (rec) => {
  if (recording !== rec) return;
  if (!rec.source.isConnected || location.pathname !== rec.path) {
    stopRecording();
    return;
  }

  if (!rec.screen.isConnected) rec.source.after(rec.screen);
  syncVolume(rec);
  steer(rec);
  if (!rec.buffer || rec.buffer.updating || rec.busy) return;

  const ahead = rec.next * CHUNK_SECONDS - rec.overlay.currentTime;
  if (rec.next < rec.chunks.length && ahead < LOOKAHEAD_SECONDS) appendNext(rec);
  else trimPlayed(rec);
};

const openBuffer = (rec) => {
  const media = new MediaSource();
  media.addEventListener('sourceopen', () => {
    rec.buffer = media.addSourceBuffer(PLAYBACK_TYPE);
    rec.buffer.addEventListener('updateend', () => feed(rec));
  }, { once: true });
  rec.overlay.src = URL.createObjectURL(media);
};

const startRecorder = (rec) => {
  rec.recorder.addEventListener('dataavailable', ({ data }) => {
    if (!rec.chunks.length) rec.startedAt = Date.now() - CHUNK_SECONDS * 1000;
    rec.chunks.push(data);
  });
  rec.recorder.start(CHUNK_SECONDS * 1000);
};

const startRecording = (delay) => {
  const source = liveVideo();
  if (!source || source.paused) return;

  recording = {
    delay,
    source,
    path: location.pathname,
    startedAt: Date.now(),
    recorder: new MediaRecorder(source.captureStream(), { mimeType: RECORD_TYPE, videoBitsPerSecond: RECORD_BITRATE }),
    chunks: [],
    next: 0,
    ...createScreen(source),
  };

  openBuffer(recording);
  startRecorder(recording);
  silenceSource(source);
  recording.timer = setInterval(feed, 500, recording);
};

const stopRecording = () => {
  if (!recording) return;
  const { recorder, timer, overlay, screen, source } = recording;
  recording = null;
  clearInterval(timer);
  if (recorder.state !== 'inactive') recorder.stop();
  URL.revokeObjectURL(overlay.src);
  screen.remove();
  restoreSource(source);
};

const syncRecording = () => {
  const wanted = currentDelay > 0;
  if (recording && !wanted) stopRecording();
  if (recording) recording.delay = currentDelay;
  else if (wanted) startRecording(currentDelay);
};

setInterval(syncRecording, 1000);
