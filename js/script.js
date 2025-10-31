"use strict";

document.addEventListener('DOMContentLoaded', () => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  // 各サウンドファイルのパス（HTMLと同じ順番で）
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
  let currentSource = null;
  let currentGain = null;
  let currentIndex = -1;
  const audioBuffers = [];

  // --- サウンドファイルを事前読み込み ---
  async function loadSounds() {
    for (let i = 0; i < soundFiles.length; i++) {
      const response = await fetch(soundFiles[i]);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      audioBuffers[i] = audioBuffer;
    }
  }

  // --- 再生を開始 ---
  async function playSound(index) {
    if (!audioBuffers[index]) return;

    // 再生中の音があればフェードアウトして停止
    if (currentSource) {
      await fadeOutAndStop(currentGain);
      clearIndicators();
      resetButtonStyles();
    }

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffers[index];

    const gainNode = audioContext.createGain();
    const volume = parseFloat(volumes[index].value) || 1.0;
    gainNode.gain.value = 0;

    source.connect(gainNode).connect(audioContext.destination);

    // 再生開始
    source.start(0);
    fadeIn(gainNode, volume);

    currentSource = source;
    currentGain = gainNode;
    currentIndex = index;

    // UI更新
    buttons[index].classList.add('btn-playing');
    playingTexts[index].textContent = '　再生中...';

    // 再生終了時にUIリセット
    source.onended = () => {
      if (currentIndex === index) {
        clearIndicators();
        resetButtonStyles();
        currentSource = null;
        currentGain = null;
      }
    };
  }

  // --- フェードアウトして停止 ---
  function fadeOutAndStop(gainNode) {
    return new Promise((resolve) => {
      if (!gainNode) return resolve();
      const now = audioContext.currentTime;
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.linearRampToValueAtTime(0, now + fadeDuration);
      setTimeout(() => resolve(), fadeDuration * 1000);
    });
  }

  // --- フェードイン ---
  function fadeIn(gainNode, targetVolume) {
    const now = audioContext.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(targetVolume, now + fadeDuration);
  }

  // --- UI操作 ---
  const clearIndicators = () => playingTexts.forEach(t => (t.textContent = ''));
  const resetButtonStyles = () => buttons.forEach(btn => btn.classList.remove('btn-playing'));

  // --- ボタン操作 ---
  buttons.forEach((btn, index) => {
    btn.addEventListener('click', async () => {
      // iOSの自動再生制限対策：初回クリックでcontextを再開
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      if (currentIndex === index) {
        // 同じ音が再生中 → フェードアウトで停止
        await fadeOutAndStop(currentGain);
        clearIndicators();
        resetButtonStyles();
        currentSource = null;
        currentGain = null;
        currentIndex = -1;
      } else {
        // 新しい音を再生
        await playSound(index);
      }
    });
  });

  // --- スライダーでリアルタイム音量変更 ---
  volumes.forEach((slider, i) => {
    slider.addEventListener('input', () => {
      if (i === currentIndex && currentGain) {
        currentGain.gain.value = parseFloat(slider.value);
      }
    });
  });

  // --- 起動時に読み込み開始 ---
  loadSounds();
});
