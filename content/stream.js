const liveVideo = () => [...document.querySelectorAll('video')].find((video) => video.duration === Infinity);
