const params = new URLSearchParams(new URL(window.location.toLocaleString()).search);
const subreddit = params.get('r');
const query = params.get('q');

let loopPos = -2;
let currentVideos = JSON.parse(localStorage.getItem('saved')) || [];
let nextFullname = "";
let nextThumbnail;

const mainVid = document.querySelector('#main-vid');
const vidTitle = document.querySelector('#vid-title');
const nextVidThumb = document.querySelector('#next-vid-thumb');

async function getNextVideo() {
    loopPos++;
    const postData = currentVideos[loopPos];
    const redditMedia = postData.secure_media.reddit_video;
    nextThumbnail = currentVideos[loopPos + 1].preview.images[0].source.url.replace(/amp;/g, '');

    if (redditMedia) {
        mainVid.src = redditMedia.fallback_url;
    } else {
        mainVid.src = postData.preview.reddit_video_preview.fallback_url;
    }

    vidTitle.textContent = postData.title;
    mainVid.play();
}

function getPrevVideo() {
    loopPos--;
    const postData = currentVideos[loopPos];
    mainVid.src = postData.secure_media.reddit_video.fallback_url;
    vidTitle.textContent = postData.title;
    mainVid.play();
}

function playPause() {
    if (mainVid.paused) {
        mainVid.play();
    } else {
        mainVid.pause();
    }
}

let startY;
let endY;

document.addEventListener('touchstart', function (e) {
    startY = e.touches[0].clientY;
});

document.addEventListener('touchmove', function (e) {
    const currentY = e.touches[0].clientY;
    const moved = currentY - startY;

    if (moved > -250) {
        nextVidThumb.style = `transform: translateY(${250+moved}%);`;
    }
})

document.addEventListener('touchend', async function (e) {
    endY = e.changedTouches[0].clientY;
    console.log(endY - startY);
    if (endY - startY <= -250) {
        const videoLoadedPromise = new Promise(resolve => {
            mainVid.addEventListener('canplaythrough', function () {
                resolve();
            });
        });

        await getNextVideo();
        await videoLoadedPromise;
        
        nextVidThumb.style = `transform: translateY(250%);`;
        nextVidThumb.src = nextThumbnail;
    }
    if (endY - startY >= 250) {
        await getPrevVideo();
    }
});