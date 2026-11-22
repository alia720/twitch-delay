const describe = (delay) => {
  if (!delay) return 'Watching live';
  if (recording) return `Moving to ${formatDelay(delay)} behind live`;
  return `Recording for a ${formatDelay(delay)} delay`;
};

const applyDelay = (delay) => {
  if (!Number.isFinite(delay) || delay < 0) return { ok: false, message: 'Enter a valid delay.' };
  if (delay > MAX_DELAY) return { ok: false, message: 'The longest delay is 1 hour.' };

  const message = describe(delay);
  applySetting(delay);
  saveDelay(delay);
  return { ok: true, message };
};

chrome.runtime.onMessage.addListener(({ delay, measure }, sender, reply) => {
  if (measure) return reply(measureDelay());
  const status = applyDelay(delay);
  saveStatus(status);
  reply(status);
});
