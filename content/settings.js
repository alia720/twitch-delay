const MAX_DELAY = 3600;

let currentDelay = 0;

const applySetting = (delay = 0) => {
  currentDelay = delay;
};

const saveDelay = (delay) => chrome.storage.local.set({ delay });

const saveStatus = (status) => chrome.storage.local.set({ status });

chrome.storage.local.get({ delay: 0 }, ({ delay }) => applySetting(delay));

chrome.storage.onChanged.addListener(({ delay }) => {
  if (delay) applySetting(delay.newValue);
});
