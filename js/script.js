"use strict";

document.addEventListener('DOMContentLoaded', () => {
    function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

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

  const loopButton = document.getElementById('loopAll');
  const playingTexts = [
    document.getElementById('playing1'),
    document.getElementById('playing2'),
    document.getElementById('playing3')
  ];
  const volumeSlider = document.getElementById('volumeAll');
  let volumeValue = document.getElementById('volumeValue');

  const durations = [
    document.getElementById('duration1'),
    document.getElementById('duration2'),
    document.getElementById('duration3')
  ];

  const fadeDuration = 0.8;
  const audioBuffers = [];
  let currentSource = null;
  let currentGain = null;
  let currentIndex = -1;
  let loopState = false; // ループ状態（共通）
  let countdownTimer = null;

  function startCountdown(index, totalSeconds) {
    clearInterval(countdownTimer);

    let remaining = totalSeconds;
    durations[index].textContent = `残り時間 : ${formatTime(remaining)}`;
    countdownTimer = setInterval(() => {
      if (loopState) {
        durations[index].textContent = `残り時間 : ∞`;
        return;
      }

      remaining -= 1;
      if (remaining <= 0) {
        durations[index].textContent = `再生時間 : ${formatTime(totalSeconds)}`;
        clearInterval(countdownTimer);
      } else {
        durations[index].textContent = `残り時間 : ${formatTime(remaining)}`;
      }
    }, 1000);
  }

  function stopCountdown(index) {
    clearInterval(countdownTimer);
    if (index >= 0) {
      const buffer = audioBuffers[index];
      if (buffer) {
        const total = Math.floor(buffer.duration);
        durations[index].textContent = `再生時間 : ${formatTime(total)}`;
      }
    }
  }

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
    return new Promise(resolve => {
      if (!gainNode) return resolve();
      const now = audioContext.currentTime;
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.linearRampToValueAtTime(0, now + fadeDuration);
      setTimeout(resolve, fadeDuration * 1000);
    });
  }

  async function stopCurrent() {
    if (currentSource) {
      await fadeOut(currentGain);
      try { currentSource.stop(); } catch { }
      currentSource.disconnect();
      currentGain.disconnect();
      currentSource = null;
      currentGain = null;
      currentIndex = -1;
    }
    clearIndicators();
    resetPlayButtons();
    stopCountdown(currentIndex);
  }

  const clearIndicators = () => playingTexts.forEach(t => (t.textContent = ''));
  const resetPlayButtons = () => buttons.forEach(btn => btn.classList.remove('btn-playing'));

  async function playSound(index) {
    await audioContext.resume();

    const buffer = await loadSound(index);
    if (!buffer) return;

    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    const volume = parseFloat(volumeSlider.value) || 1.0;

    source.buffer = buffer;
    source.connect(gainNode).connect(audioContext.destination);
    source.loop = loopState; // ループ設定
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
      if (currentIndex === index && !loopState) {
        clearIndicators();
        resetPlayButtons();
        currentSource = null;
        currentGain = null;
        currentIndex = -1;
        stopCountdown(index);
      }
    };

    const totalSeconds = Math.floor(buffer.duration);
    startCountdown(index, totalSeconds);
  }

  function updatePlayingText(i) {
    playingTexts[i].textContent = '　再生中...';
  }

  // --- 再生ボタン ---
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
  // ページ読み込み時：保存された音量を読み込む
  const savedVolume = localStorage.getItem('volumeLevel');
  if (savedVolume !== null) {
    const vol = parseFloat(savedVolume);
    volumeSlider.value = vol;
    volumeValue.textContent = Math.round(vol * 100) + '%';
    // 再生開始前でも反映できるようGainNodeには後で適用される
  }

  // スライダー操作時：音量変更と保存
  volumeSlider.addEventListener('input', () => {
    const val = parseFloat(volumeSlider.value);
    const percent = Math.round(val * 100);
    volumeValue.textContent = percent + '%';

    // 現在のGainNodeにも反映
    if (currentGain) {
      currentGain.gain.value = val;
    }

    // ローカルに保存
    localStorage.setItem('volumeLevel', val.toFixed(2));
  });


  // --- ループボタン ---
  loopButton.addEventListener('click', () => {
    loopState = !loopState;
    loopButton.textContent = loopState ? 'ループON' : 'ループOFF';
    loopButton.classList.toggle('btn-loop-on', loopState);

    // 再生中に即反映
    if (currentSource) {
      currentSource.loop = loopState;
      if (currentIndex >= 0) updatePlayingText(currentIndex);
    }
  });
});