"use strict";

document.addEventListener('DOMContentLoaded', () => {
  const sounds = [
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

  const fadeDuration = 800; // ms

  const clearIndicators = () => {
    playingTexts.forEach(t => (t.textContent = ''));
  };

  const resetButtonStyles = () => {
    buttons.forEach(btn => btn.classList.remove('btn-playing'));
  };

  const fadeOut = (audio) => {
    return new Promise((resolve) => {
      if (audio.paused) return resolve();
      const step = 0.05;
      const interval = fadeDuration / (1 / step);
      const fade = setInterval(() => {
        if (audio.volume > step) {
          audio.volume -= step;
        } else {
          audio.volume = 0;
          audio.pause();
          audio.currentTime = 0;
          clearInterval(fade);
          resolve();
        }
      }, interval);
    });
  };

  const fadeIn = (audio, targetVolume = 1) => {
    return new Promise((resolve) => {
      audio.volume = 0;
      audio.play();
      const step = 0.05;
      const interval = fadeDuration / (1 / step);
      const fade = setInterval(() => {
        if (audio.volume < targetVolume - step) {
          audio.volume += step;
        } else {
          audio.volume = targetVolume;
          clearInterval(fade);
          resolve();
        }
      }, interval);
    });
  };

  const fadeOutAll = async () => {
    for (const s of sounds) {
      await fadeOut(s);
    }
    clearIndicators();
    resetButtonStyles();
  };

  buttons.forEach((btn, index) => {
    btn.addEventListener('click', async () => {
      const sound = sounds[index];
      const text = playingTexts[index];
      const targetVolume = parseFloat(volumes[index].value);

      // すでに再生中なら停止
      if (!sound.paused) {
        await fadeOut(sound);
        text.textContent = '';
        btn.classList.remove('btn-playing');
        return;
      }

      // 他の音をフェードアウト＋スタイルリセット
      await fadeOutAll();
      clearIndicators();
      resetButtonStyles();

      // 再生開始
      text.textContent = '　再生中...';
      btn.classList.add('btn-playing');
      await fadeIn(sound, targetVolume);
    });
  });

  // スライダーの音量変更
  volumes.forEach((slider, i) => {
    slider.addEventListener('input', () => {
      sounds[i].volume = parseFloat(slider.value);
    });
  });

  // 自然終了時にボタン色リセット
  sounds.forEach((sound, i) => {
    sound.addEventListener('ended', () => {
      playingTexts[i].textContent = '';
      buttons[i].classList.remove('btn-playing');
    });
  });
});

