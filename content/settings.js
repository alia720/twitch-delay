const MAX_DELAY = 3600;
const DELAY_KEY = 'twitchDelay';

let currentDelay = Number(sessionStorage.getItem(DELAY_KEY)) || 0;

const applySetting = (delay) => {
  currentDelay = delay;
  sessionStorage.setItem(DELAY_KEY, delay);
};
