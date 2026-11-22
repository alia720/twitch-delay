const splitTime = (seconds) => ({
  h: Math.floor(seconds / 3600),
  m: Math.floor((seconds % 3600) / 60),
  s: Math.floor(seconds % 60),
});

const pad = (value) => String(value).padStart(2, '0');

const formatDelay = (seconds) => {
  const { h, m } = splitTime(seconds);
  const s = Number((seconds % 60).toFixed(1));
  return [h && `${h}h`, m && `${m}m`, s && `${s}s`].filter(Boolean).join(' ') || '0s';
};

const formatClock = (seconds) => {
  const value = Math.max(0, seconds);
  if (value < 60) return `${value.toFixed(1)}s`;
  const { h, m, s } = splitTime(value);
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};
