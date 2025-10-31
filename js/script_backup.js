jQuery(function($) {

  const $sounds = [
    $('#sound1').get(0),
    $('#sound2').get(0),
    $('#sound3').get(0),
  ];

  const $flushs = [
    $('#flush1'),
    $('#flush2'),
    $('#flush3'),
  ];

  $flushs[0].click(function() {
    if ($sounds[1].paused === false || $sounds[2].paused === false) {
      return false;
    }

    if ($sounds[0].paused === true) {
      $('#playing1').text('　再生中...');
      $sounds[0].play();
    } else {
      $('#playing1').text('');
      $sounds[0].currentTime = 0;
      $sounds[0].pause();
    }
  });
  $flushs[1].click(function() {
    if ($sounds[0].paused === false || $sounds[2].paused === false) {
      return false;
    }

    if ($sounds[1].paused === true) {
      $('#playing2').text('　再生中...');
      $sounds[1].play();
    } else {
      $('#playing2').text('');
      $sounds[1].currentTime = 0;
      $sounds[1].pause();
    }
  });
  $flushs[2].click(function() {
    if ($sounds[0].paused === false || $sounds[1].paused === false) {
      return false;
    }

    if ($sounds[2].paused === true) {
      $('#playing3').text('　再生中...');
      $sounds[2].play();
    } else {
      $('#playing3').text('');
      $sounds[2].currentTime = 0;
      $sounds[2].pause();
    }
  });

  setInterval(function() {
    if ($sounds[0].paused === true && $sounds[1].paused === true && $sounds[2].paused === true) {
      $('#playing1').text('');
      $('#playing2').text('');
      $('#playing3').text('');
    }
  }, 400);


});