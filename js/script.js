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

  const fadeDuration = 400; // フェード短縮でモバイル負荷軽減

  const clearIndicators = () => playingTexts.forEach(t => (t.textContent = ''));
  const resetButtonStyles = () => buttons.forEach(btn => btn.classList.remove('btn-playing'));

  const fadeOut = (audio) => {
    return new Promise((resolve) => {
      if (audio.paused) return resolve();
      const startVolume = audio.volume;
      const step = startVolume / (fadeDuration / 50);
      const fade = setInterval(() => {
        if (audio.volume > step) {
          audio.volume -= step;
        } else {
          audio.pause();
          audio.currentTime = 0;
          audio.volume = startVolume;
          clearInterval(fade);
          setTimeout(resolve, 100);
        }
      }, 50);
    });
  };

  const stopAllSounds = async () => {
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

      // 現在その音が再生中なら停止
      if (!sound.paused) {
        await fadeOut(sound);
        text.textContent = '';
        btn.classList.remove('btn-playing');
        return;
      }

      // 他の音を止める
      await stopAllSounds();

      // 新しい音を再生
      resetButtonStyles();
      text.textContent = '　再生中...';
      btn.classList.add('btn-playing');

      try {
        sound.volume = 1.0;
        await sound.play(); // iOSではここが重要
      } catch (e) {
        console.warn('再生エラー:', e);
      }
    });
  });

  sounds.forEach((sound, i) => {
    sound.addEventListener('ended', () => {
      playingTexts[i].textContent = '';
      buttons[i].classList.remove('btn-playing');
    });
  });
});

