const control = {
  likeThreshold: 1.20, // +20%
  superLikeThreshold: 1.30, // +30%
  targetDistance: 100,
  lastMove: Date.now(),
  sumSpeed: 0,
  averageSpeed: 0,
  updateCount: 0,
  overallDistance: 0,
  currentDistance: 0,
  lastNext: 1,
};

control.next = function () {
  let e = new KeyboardEvent('keyup', {'keyCode': 32, 'which': 32});
  document.dispatchEvent(e);
}

control.move = function (speed) {
  control.sumSpeed += speed;
  control.updateCount += 1;
  control.averageSpeed = control.sumSpeed / control.updateCount;

  let now = Date.now();
  let timePass = (now - control.lastMove) / 1000;
  let updatedDistance = speed * timePass;

  control.currentDistance += updatedDistance;
  control.lastMove = now;
  console.log('AVG SPEED', control.averageSpeed);
  console.log('currentDistance', control.currentDistance);

  let newNext = Math.floor(control.currentDistance / (control.targetDistance / 5));
  if (newNext > control.lastNext) {
    control.next();
  }
  control.lastNext = newNext;

  let distanceDiff = control.currentDistance - control.targetDistance;
  if (distanceDiff >= 0 && control.averageSpeed > 0) {
    control.currentDistance = distanceDiff;
    // Swipe
    if (speed >= control.averageSpeed * control.superLikeThreshold) {
      // Sprint >> Super like
      console.log('⭐ Super Like!', speed, control.averageSpeed * control.superLikeThreshold);
      control.action('super-like');
    } else if (speed >= control.averageSpeed * control.likeThreshold) {
      // Attack >> Like
      console.log('💗 Like', speed, control.averageSpeed * control.likeThreshold);
      control.action('like');
    } else {
      // Pass
      console.log('❌ Pass', speed, control.averageSpeed * control.superLikeThreshold);
      control.action('pass');
    }
  }
};

control.action = function (action) {
  let bnts = document.querySelectorAll('button.button');
  if (bnts.length === 0) {
    // Not found buttons.
    return;
  }
  if (action === 'super-like') {
    bnts[2].click();
  } else if (action === 'like') {
    bnts[3].click();
  } else { // pass
    bnts[1].click();
  }
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

