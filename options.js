function setStatus(message) {
  let status = document.getElementById('status');
  status.textContent = message;
  setTimeout(function () {
    status.textContent = '';
  }, 2500);
}

// Saves options to chrome.storage
function save_options() {
  let swipeDistance = document.getElementById('swipeDistance').value;
  let wheelCircumference = document.getElementById('wheelCircumference').value;

  if (swipeDistance < 50) {
    setStatus('Settings out of supported range: swipeDistance < 50m');
    return;
  }

  if (wheelCircumference < 0.935 || wheelCircumference > 2.326) {
    setStatus('Settings out of supported range: wheelCircumference  < 0.935m or > 2.326m');
    return;
  }

  chrome.storage.sync.set({
    swipeDistance: swipeDistance,
    wheelCircumference: wheelCircumference,
  }, function () {
    setStatus('Settings saved.');
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  chrome.storage.sync.get({
    swipeDistance: 100,
    wheelCircumference: 2.105,
  }, function (items) {
    document.getElementById('swipeDistance').value = items.swipeDistance;
    document.getElementById('wheelCircumference').value = items.wheelCircumference;
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
