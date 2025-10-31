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

  const loopButtons = [
    document.getElementById('loop1'),
    document.getElementById('loop2'),
    document.getElementById('loop3')
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
  const loopStates = [false, false, false]; // ループ状態

  async function loadSound(index) {
    if (audioBuffers[index]) return audioBuffers[index];
    const response = await fetch(soundFiles[index]);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    audioBuffers[index] = audioBuffer;
    return audioBuffer;
  }

  function fadeIn(gainNode, targetVolume) {
    const now = audioContext.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(targetVolume, now + fadeDuration);
  }

  function fadeOut(gainNode) {
    return new Promise((resolve) => {
      if (!gainNode) return resolve();
      const now = audioContext.currentTime;
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.linearRampToValueAtTime(0, now + fadeDuration);
      setTimeout(() => resolve(), fadeDuration * 1000);
    });
  }

  async function stopCurrent() {
    if (currentSource) {
      await fadeOut(currentGain);
      try { currentSource.stop(); } catch {}
      currentSource.disconnect();
      currentGain.disconnect();
      currentSource = null;
      currentGain = null;
      currentIndex = -1;
    }
    clearIndicators();
    resetPlayButtons(); // ← 再生ボタンのみリセット
  }

  const clearIndicators = () => playingTexts.forEach(t => (t.textContent = ''));
  const resetPlayButtons = () => buttons.forEach(btn => btn.classList.remove('btn-playing'));

  async function playSound(index) {
    await audioContext.resume();

    const buffer = await loadSound(index);
    if (!buffer) return;

    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    const volume = parseFloat(volumes[index].value) || 1.0;

    source.buffer = buffer;
    source.connect(gainNode).connect(audioContext.destination);
    source.loop = loopStates[index];
    gainNode.gain.value = 0;

    await stopCurrent();

    source.start(0);
    fadeIn(gainNode, volume);

    currentSource = source;
    currentGain = gainNode;
    currentIndex = index;

    buttons[index].classList.add('btn-playing');
    updatePlayingText(index);

    source.onended = () => {
      if (currentIndex === index && !loopStates[index]) {
        clearIndicators();
        resetPlayButtons();
        currentSource = null;
        currentGain = null;
        currentIndex = -1;
      }
    };
  }

  // 再生中テキスト更新関数
  function updatePlayingText(i) {
    playingTexts[i].textContent = loopStates[i]
      ? '　再生中（ループ）...'
      : '　再生中...';
  }

  // --- メインボタン ---
  buttons.forEach((btn, i) => {
    btn.addEventListener('click', async () => {
      if (currentIndex === i) {
        await stopCurrent();
      } else {
        await playSound(i);
      }
    });
  });

  // --- 音量スライダー ---
  volumes.forEach((slider, i) => {
    slider.addEventListener('input', () => {
      if (i === currentIndex && currentGain) {
        currentGain.gain.value = parseFloat(slider.value);
      }
    });
  });

  // --- ループボタン ---
  loopButtons.forEach((loopBtn, i) => {
    loopBtn.addEventListener('click', () => {
      loopStates[i] = !loopStates[i];
      if (loopStates[i]) {
        loopBtn.textContent = 'ループON';
        loopBtn.classList.add('btn-loop-on');
      } else {
        loopBtn.textContent = 'ループOFF';
        loopBtn.classList.remove('btn-loop-on');
      }

      // 再生中にも即反映
      if (i === currentIndex && currentSource) {
        currentSource.loop = loopStates[i];
        updatePlayingText(i);
      }
    });
  });
});


