lucide.createIcons();

const UNIT_SECONDS = [3600, 60, 1];

const form = document.querySelector('form');
const { amount, unit } = form.elements;
const status = document.querySelector('#status');
const readoutValue = document.querySelector('#readout-value');
const readoutLabel = document.querySelector('#readout-label');

let filled = false;

const showStatus = ({ ok, message }) => {
  status.hidden = !message;
  status.dataset.ok = ok;
  status.textContent = message;
};

const showReadout = ({ value, label }) => {
  readoutValue.textContent = value;
  readoutLabel.textContent = label;
};

const fillDelay = (delay) => {
  const size = UNIT_SECONDS.find((seconds) => delay % seconds === 0) ?? 1;
  unit.value = size;
  amount.value = delay / size;
};

const activeTabId = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab.id;
};

const sendToTab = async (message) => chrome.tabs.sendMessage(await activeTabId(), message);

const sendDelay = async (delay) => {
  try {
    showStatus(await sendToTab({ delay }));
  } catch {
    showStatus({ ok: false, message: 'Open a Twitch tab first.' });
  }
};

const measure = async () => {
  try {
    const state = await sendToTab({ measure: true });
    showReadout(state);
    if (!filled && state.delay) fillDelay(state.delay);
  } catch {
    showReadout({ value: '—', label: 'open a Twitch stream' });
  }
  filled = true;
};

form.addEventListener('submit', (event) => {
  event.preventDefault();
  sendDelay(Number(amount.value) * Number(unit.value));
});

document.querySelector('#live').addEventListener('click', () => sendDelay(0));

measure();
setInterval(measure, 1000);
