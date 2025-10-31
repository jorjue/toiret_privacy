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

  const fadeDuration = 400;
  let currentIndex = -1;
  let fadeTimer = null;
  let lastSliderValues = [1, 1, 1]; // スライダーの値を保持

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

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
          audio.volume = lastSliderValues[currentIndex] || 1; // ←停止後に戻す
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

  // --- ボタン操作 ---
  buttons.forEach((btn, i) => {
    btn.addEventListener('click', async () => {
      const audio = audios[i];
      const volume = parseFloat(volumes[i].value);
      lastSliderValues[i] = volume;

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

  // --- スライダー操作 ---
  volumes.forEach((slider, i) => {
    if (isMobile) {
      // モバイルではスライダー無効化（仕様上操作不可）
      slider.disabled = true;
      slider.style.opacity = 0.5;
    } else {
      slider.addEventListener('input', () => {
        const val = parseFloat(slider.value);
        lastSliderValues[i] = val;
        audios[i].volume = val;
      });
    }
  });

  // --- 終了時 ---
  audios.forEach((a, i) => {
    a.addEventListener('ended', () => {
      clearIndicators();
      resetButtons();
      currentIndex = -1;
    });

    // 音量キーなどでpause発火時に状態をリセット
    a.addEventListener('pause', () => {
      if (i === currentIndex && a.currentTime > 0 && !a.ended) {
        clearIndicators();
        resetButtons();
        currentIndex = -1;
      }
    });
  });
});

