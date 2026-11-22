lucide.createIcons();

const form = document.querySelector('form');
const { amount, unit } = form.elements;
const status = document.querySelector('#status');
const readoutValue = document.querySelector('#readout-value');
const readoutLabel = document.querySelector('#readout-label');

const showStatus = ({ ok, message } = {}) => {
  status.hidden = !message;
  status.dataset.ok = ok;
  status.textContent = message ?? '';
};

const showReadout = ({ value, label }) => {
  readoutValue.textContent = value;
  readoutLabel.textContent = label;
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
    showReadout(await sendToTab({ measure: true }));
  } catch {
    showReadout({ value: '—', label: 'open a Twitch stream' });
  }
};

form.addEventListener('submit', (event) => {
  event.preventDefault();
  chrome.storage.local.set({ amount: amount.value, unit: unit.value });
  sendDelay(Number(amount.value) * Number(unit.value));
});

document.querySelector('#live').addEventListener('click', () => sendDelay(0));

chrome.storage.local.get({ amount: '15', unit: '1', status: null }, (saved) => {
  amount.value = saved.amount;
  unit.value = saved.unit;
  showStatus(saved.status ?? {});
});

measure();
setInterval(measure, 1000);
