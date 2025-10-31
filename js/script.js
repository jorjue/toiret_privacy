"use strict";

document.addEventListener('DOMContentLoaded', () => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const soundFiles = [
    'sound/se_maoudamashii_toire.mp3',
    'sound/taki.mp3',
    'sound/water-flow.mp3'
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

  const fadeDuration = 0.8; // 秒
  const audioBuffers = [];
  let currentSource = null;
  let currentGain = null;
  let currentIndex = -1;

  // --- 音声ファイルを読み込み・デコード ---
  async function loadSound(index) {
    if (audioBuffers[index]) return audioBuffers[index];
    const response = await fetch(soundFiles[index]);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    audioBuffers[index] = audioBuffer;
    return audioBuffer;
  }

  // --- フェードイン ---
  function fadeIn(gainNode, targetVolume) {
    const now = audioContext.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(targetVolume, now + fadeDuration);
  }

  // --- フェードアウト ---
  function fadeOut(gainNode) {
    return new Promise((resolve) => {
      if (!gainNode) return resolve();
      const now = audioContext.currentTime;
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.linearRampToValueAtTime(0, now + fadeDuration);
      setTimeout(() => resolve(), fadeDuration * 1000);
    });
  }

  // --- 停止処理 ---
  async function stopCurrent() {
    if (currentSource) {
      await fadeOut(currentGain);
      try {
        currentSource.stop();
      } catch {}
      currentSource.disconnect();
      currentGain.disconnect();
      currentSource = null;
      currentGain = null;
      currentIndex = -1;
    }
    clearIndicators();
    resetButtons();
  }

  const clearIndicators = () => playingTexts.forEach(t => (t.textContent = ''));
  const resetButtons = () => buttons.forEach(btn => btn.classList.remove('btn-playing'));

  // --- 音声再生処理 ---
  async function playSound(index) {
    await audioContext.resume(); // iOS対策：必ず再開

    const buffer = await loadSound(index);
    if (!buffer) return;

    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    const volume = parseFloat(volumes[index].value) || 1.0;

    source.buffer = buffer;
    source.connect(gainNode).connect(audioContext.destination);
    gainNode.gain.value = 0;

    // 他の音を停止してから再生
    await stopCurrent();

    source.start(0);
    fadeIn(gainNode, volume);

    currentSource = source;
    currentGain = gainNode;
    currentIndex = index;

    buttons[index].classList.add('btn-playing');
    playingTexts[index].textContent = '　再生中...';

    source.onended = () => {
      if (currentIndex === index) {
        clearIndicators();
        resetButtons();
        currentSource = null;
        currentGain = null;
        currentIndex = -1;
      }
    };
  }

  // --- ボタン操作 ---
  buttons.forEach((btn, i) => {
    btn.addEventListener('click', async () => {
      if (currentIndex === i) {
        await stopCurrent();
      } else {
        await playSound(i);
      }
    });
  });

  // --- スライダー操作 ---
  volumes.forEach((slider, i) => {
    slider.addEventListener('input', () => {
      if (i === currentIndex && currentGain) {
        currentGain.gain.value = parseFloat(slider.value);
      }
    });
  });
});

