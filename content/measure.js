const measureRecording = (rec) => {
  const wait = waitTime(rec);
  if (wait > 2) return { value: formatClock(wait), label: 'until playback starts' };
  return { value: formatClock(elapsed(rec) - rec.overlay.currentTime), label: 'behind live' };
};

const measureDelay = () => {
  if (recording) return measureRecording(recording);
  if (!liveVideo()) return { value: '—', label: 'no live stream on this tab' };
  if (currentDelay) return { value: '…', label: 'waiting for the stream to play' };
  return { value: 'Live', label: 'no delay set' };
};
