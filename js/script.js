"use strict";

document.addEventListener('DOMContentLoaded', () => {
  const audios = [
    document.getElementById('sound1'),
    document.getElementById('sound2'),
    document.getElementById('sound3')
  ];

  const buttons = [
    document.getElementById('flush1'),
    document.getElementById('flush2'),
    document.getElementById('flush3')
  ];

  const playingTexts = [
    document.getElementById('playing1'),
    document.getElementById('playing2'),
    document.getElementById('playing3')
  ];

  const volumes = [
    document.getElementById('volume1'),
    document.getElementById('volume2'),
    document.getElementById('volume3')
  ];

  const fadeDuration = 400; // ms
  let currentIndex = -1;
  let fadeTimer = null;

  const clearIndicators = () => playingTexts.forEach(t => (t.textContent = ''));
  const resetButtons = () => buttons.forEach(btn => btn.classList.remove('btn-playing'));

  // フェードアウト（<audio>のvolumeを使う）
  function fadeOut(audio) {
    return new Promise(resolve => {
      if (!audio || audio.paused) return resolve();
      let v = audio.volume;
      clearInterval(fadeTimer);
      fadeTimer = setInterval(() => {
        v -= 0.05;
        if (v <= 0) {
          audio.pause();
          audio.currentTime = 0;
          audio.volume = 1;
          clearInterval(fadeTimer);
          resolve();
        } else {
          audio.volume = v;
        }
      }, fadeDuration / 20);
    });
  }

  // フェードイン
  function fadeIn(audio, volume = 1.0) {
    audio.volume = 0;
    audio.play().catch(() => {}); // iOS対策
    let v = 0;
    clearInterval(fadeTimer);
    fadeTimer = setInterval(() => {
      v += 0.05;
      if (v >= volume) {
        v = volume;
        clearInterval(fadeTimer);
      }
      audio.volume = v;
    }, fadeDuration / 20);
  }

  buttons.forEach((btn, i) => {
    btn.addEventListener('click', async () => {
      const audio = audios[i];
      const volume = parseFloat(volumes[i].value);

      // 再生中のものがある場合
      if (currentIndex === i) {
        await fadeOut(audio);
        clearIndicators();
        resetButtons();
        currentIndex = -1;
        return;
      }

      // 他の音を停止
      if (currentIndex >= 0) {
        await fadeOut(audios[currentIndex]);
      }

      clearIndicators();
      resetButtons();

      // 新しい音を再生
      fadeIn(audio, volume);
      btn.classList.add('btn-playing');
      playingTexts[i].textContent = '　再生中...';
      currentIndex = i;
    });
  });

  // スライダー変更
  volumes.forEach((slider, i) => {
    slider.addEventListener('input', () => {
      audios[i].volume = parseFloat(slider.value);
    });
  });

  // 終了時
  audios.forEach((a, i) => {
    a.addEventListener('ended', () => {
      clearIndicators();
      resetButtons();
      currentIndex = -1;
    });
  });
});
