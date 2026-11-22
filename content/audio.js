(() => {
  const data = document.documentElement.dataset;
  const wrapped = new WeakSet();

  const recording = () => data.twitchRecording === 'on';

  const redirect = (video, name, key, parse) => {
    const native = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, name);
    Object.defineProperty(video, name, {
      configurable: true,
      get: () => (recording() ? parse(data[key]) : native.get.call(video)),
      set: (value) => {
        if (!recording()) return native.set.call(video, value);
        data[key] = value;
        video.dispatchEvent(new Event('volumechange'));
      },
    });
  };

  const wrap = (video) => {
    redirect(video, 'muted', 'twitchMuted', (value) => value === 'true');
    redirect(video, 'volume', 'twitchVolume', Number);
    wrapped.add(video);
  };

  const tick = () => {
    document.querySelectorAll('video').forEach((video) => {
      if (!wrapped.has(video)) wrap(video);
    });
  };

  setInterval(tick, 1000);
})();
