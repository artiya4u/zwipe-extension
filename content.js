const control = {
  likeThreshold: 1.20, // +20%
  superLikeThreshold: 1.30, // +30%
  targetDistance: 100,
  lastMove: Date.now(),
  speedArr: [],
  averageSpeed: 0,
  overallDistance: 0,
  currentDistance: 0,
  lastNext: 0,
};

control.nextPhotoDesktop = function () { // Space to browse next photo. Only work on desktop mode.
  let e = new KeyboardEvent('keyup', {'keyCode': 32, 'which': 32});
  document.dispatchEvent(e);
}

control.nextPhoto = function () { // Browse next photo for active button.
  let activeBullets = document.querySelectorAll("button.bullet.bullet--active");
  for (let activeBullet of activeBullets) {
    let bullet = activeBullet.nextSibling;
    if (bullet !== null) {
      bullet.click();
    }
  }
}

control.resetBrowseImage = function () { // Browse next photo for active button.
  let activeBullets = document.querySelectorAll("button.bullet.bullet--active");
  for (let activeBullet of activeBullets) {
    let bullet = activeBullet.parentNode.firstChild;
    if (bullet !== null) {
      bullet.click();
    }
  }
}

function lastAvg(array, n) {
  let avg = null;
  if (array.length > n) {
    const sum = array.slice(array.length - n, array.length).reduce((a, b) => a + b, 0);
    avg = (sum / n) || 0;
  }
  return avg;
}

function toKPH(speed) {
  return (speed * 3600 / 1000).toFixed(2);
}

control.move = function (speed) {
  let now = Date.now();
  control.speedArr.push(speed);
  control.averageSpeed = lastAvg(control.speedArr, 100);
  if (control.averageSpeed === null) {
    control.lastMove = now;
    console.log('warm-up', '0.0', '0.00', toKPH(speed));
    return;
  }

  let timePass = (now - control.lastMove) / 1000;
  if ((now - control.lastMove) / 1000 > 10) {
    console.log('warm-up', '0.0', '0.00', toKPH(speed));
    return;
  }
  let updatedDistance = speed * timePass;

  control.currentDistance += updatedDistance;
  control.lastMove = now;

  const maxBrowsePhoto = 5;  // Browse photo max 5 times
  let newNext = Math.floor(control.currentDistance / (control.targetDistance / maxBrowsePhoto));
  if (newNext > control.lastNext) {
    control.nextPhoto();
  }
  control.lastNext = newNext;
  let action = 'pass';
  let distanceDiff = control.currentDistance - control.targetDistance;
  // Swipe
  if (speed >= control.averageSpeed * control.superLikeThreshold) {
    action = 'super-like';
  } else if (speed >= control.averageSpeed * control.likeThreshold) {
    // Attack >> Like
    action = 'like';
  } else {
    // Pass
    action = 'pass';
  }
  console.log(action, control.currentDistance.toFixed(1), toKPH(control.averageSpeed), toKPH(speed));
  console.log(distanceDiff);
  // Last effort
  if (distanceDiff >= 0) {
    if (distanceDiff > 20) {
      control.currentDistance = 0;
      return;
    }
    control.currentDistance = distanceDiff;
    control.action(action);
  }
};

control.action = function (action) {
  let bnts = document.querySelectorAll('button.button');
  if (bnts.length !== 5) {
    // Not found buttons.
    return;
  }
  if (action === 'super-like') {
    console.log('⭐ Send Super Like!');
    let noSuperLike = bnts[2].parentNode.parentNode.querySelectorAll("span[aria-label=\"0 remaining\"]");
    if (noSuperLike.length === 1) {
      // No super like, send like
      bnts[3].click();
    } else {
      // Send super like
      bnts[2].click();
    }
  } else if (action === 'like') {
    console.log('💗 Send Like!');
    bnts[3].click();
  } else { // pass
    console.log('❌ Send Pass');
    bnts[1].click();
  }

  control.resetBrowseImage();

  // If popup
  setTimeout(function () {
    let bntsPopup = document.querySelectorAll('button.button');
    if (bntsPopup.length > 5) {
      // Close Popup -- No Thanks
      bntsPopup[bntsPopup.length - 1].click();
    }
  }, 1500);
}

chrome.storage.sync.get(null, function (items) {
  let swipeDistance = 100; // Ride 100m to swipe
  let wheelCircumference = 2.105; // 2.105m wheel circumference for 700x25c
  if (items.swipeDistance) {
    swipeDistance = items.swipeDistance
  }
  control.targetDistance = swipeDistance;

  if (items.wheelCircumference) {
    wheelCircumference = items.wheelCircumference
  }

  // Create WebSocket connection.
  const socket = new WebSocket('ws://127.0.0.1:48008');
  socket.onerror = function (event) {
    alert("Cannot connect to Zwipe on your PC!");
    console.error("WebSocket error observed:", event);
  };

  // Connection opened
  socket.addEventListener('open', function (event) {
    socket.send(JSON.stringify({type: 'wheel', value: wheelCircumference}));
  });

  // Listen for messages
  socket.addEventListener('message', function (event) {
    let data = JSON.parse(event.data);
    if (data.type === 'speed') {
      control.move(data.value);
    }
  });

});

