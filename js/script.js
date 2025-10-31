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

  function fadeIn(audio, volume = 1.0) {
    audio.volume = 0;
    audio.play().catch(() => {});
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

  async function stopCurrent() {
    if (currentIndex >= 0) {
      await fadeOut(audios[currentIndex]);
      clearIndicators();
      resetButtons();
      currentIndex = -1;
    }
  }

  // --- ボタンイベント ---
  buttons.forEach((btn, i) => {
    btn.addEventListener('click', async () => {
      const audio = audios[i];
      const volume = parseFloat(volumes[i].value);

      // 同じボタン → 停止
      if (currentIndex === i) {
        await stopCurrent();
        return;
      }

      // 他の音を停止してから再生
      await stopCurrent();
      fadeIn(audio, volume);
      btn.classList.add('btn-playing');
      playingTexts[i].textContent = '　再生中...';
      currentIndex = i;
    });
  });

  // --- スライダー音量変更 ---
  volumes.forEach((slider, i) => {
    slider.addEventListener('input', () => {
      audios[i].volume = parseFloat(slider.value);
    });
  });

  // --- 終了時 ---
  audios.forEach((a, i) => {
    a.addEventListener('ended', () => {
      clearIndicators();
      resetButtons();
      currentIndex = -1;
    });

    // 💡 iOS/Android: 音量ボタン押下時や一時停止時に状態同期
    a.addEventListener('pause', () => {
      // 再生が意図せず止まった場合、UIを同期
      if (i === currentIndex && a.currentTime > 0 && !a.ended) {
        console.log('pause検知: 状態リセット');
        clearIndicators();
        resetButtons();
        currentIndex = -1;
      }
    });

    a.addEventListener('volumechange', () => {
      // ハードウェア音量操作時にもスライダーを同期
      if (i === currentIndex) {
        volumes[i].value = a.volume.toFixed(2);
      }
    });
  });
});
