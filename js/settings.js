let settings = JSON.parse(localStorage.getItem('settings')) || {};

const preloadNextVid = document.querySelector('#preload-next-vid');
const clearSaved = document.querySelector('#clear-saved');

const saveSettings = document.querySelector('#save-settings');

//Load settings
preloadNextVid.checked = settings.preloadNextVid;

//Buttons
clearSaved.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear your saved videos?')) {
        localStorage.setItem('saved', JSON.stringify([]));
        location.reload();
    }
});

//Save settings
saveSettings.addEventListener('click', () => {
    settings = {
        preloadNextVid: preloadNextVid.checked,
    }
    localStorage.setItem('settings', JSON.stringify(settings));
    location.reload();
});