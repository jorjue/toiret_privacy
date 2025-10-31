"use strict";

document.addEventListener('DOMContentLoaded', () => {
  let audioContext;
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    console.error('Web Audio API未対応:', e);
    return;
  }

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

  const fadeDuration = 0.8;
  const audioBuffers = [];
  let currentSource = null;
  let currentGain = null;
  let currentIndex = -1;

  const clearIndicators = () => playingTexts.forEach(t => (t.textContent = ''));
  const resetButtons = () => buttons.forEach(btn => btn.classList.remove('btn-playing'));

  // --- Audioを安全に再生できるようにresumeを強制する ---
  async function ensureAudioUnlocked() {
    if (audioContext.state === 'suspended') {
      try {
        await audioContext.resume();
        console.log('AudioContext再開');
      } catch (e) {
        console.warn('AudioContext再開失敗', e);
      }
    }
  }

  // --- 音声読み込み ---
  async function loadAudio(index) {
    if (audioBuffers[index]) return audioBuffers[index];

    try {
      const res = await fetch(soundFiles[index]);
      const arrayBuffer = await res.arrayBuffer();
      const buffer = await audioContext.decodeAudioData(arrayBuffer);
      audioBuffers[index] = buffer;
      return buffer;
    } catch (e) {
      console.warn('Web Audio fetch失敗、<audio>タグにフォールバックします:', e);
      const fallback = document.getElementById(`sound${index + 1}`);
      if (fallback) fallback.play();
    }
  }

  async function playSound(index) {
    await ensureAudioUnlocked();

    // フェードアウトして停止
    if (currentSource) {
      await fadeOut(currentGain);
      clearIndicators();
      resetButtons();
    }

    const buffer = await loadAudio(index);
    if (!buffer) return;

    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();

    const targetVol = parseFloat(volumes[index].value) || 1.0;
    gainNode.gain.value = 0;

    source.buffer = buffer;
    source.connect(gainNode).connect(audioContext.destination);

    source.start(0);
    fadeIn(gainNode, targetVol);

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
      }
    };
  }

  async function fadeOut(gainNode) {
    return new Promise((resolve) => {
      if (!gainNode) return resolve();
      const now = audioContext.currentTime;
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.linearRampToValueAtTime(0, now + fadeDuration);
      setTimeout(() => resolve(), fadeDuration * 1000);
    });
  }

  function fadeIn(gainNode, target) {
    const now = audioContext.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(target, now + fadeDuration);
  }

  // --- イベント ---
  buttons.forEach((btn, i) => {
    btn.addEventListener('click', async () => {
      await ensureAudioUnlocked();

      if (currentIndex === i) {
        await fadeOut(currentGain);
        clearIndicators();
        resetButtons();
        currentSource = null;
        currentGain = null;
        currentIndex = -1;
      } else {
        await playSound(i);
      }
    });
  });

  volumes.forEach((slider, i) => {
    slider.addEventListener('input', () => {
      if (i === currentIndex && currentGain) {
        currentGain.gain.value = parseFloat(slider.value);
      }
    });
  });
});
