const params = new URLSearchParams(new URL(window.location.toLocaleString()).search);
const subreddit = params.get('r');
const query = params.get('q');

let loopPos = -1;
let currentVideos = JSON.parse(localStorage.getItem('saved')) || [];;
let nextFullname = "";
let nextThumbnail;
let currentVideoData;

const mainVid = document.querySelector('#main-vid');
const vidTitle = document.querySelector('#vid-title');
const nextVidThumb = document.querySelector('#next-vid-thumb');

async function getNextVideo() {
    loopPos++;
    const postData = currentVideos[loopPos].data;
    const redditMedia = postData.secure_media.reddit_video;
    currentVideoData = postData;
    nextThumbnail = currentVideos[loopPos + 1].data.preview.images[0].source.url.replace(/amp;/g, '');

    if (redditMedia) {
        mainVid.src = redditMedia.fallback_url;
    } else {
        mainVid.src = postData.preview.reddit_video_preview.fallback_url;
    }

    vidTitle.textContent = postData.title.replace(/amp;/g, '');
    vidTitle.href = "https://reddit.com" + postData.permalink;
    searchInput.placeholder = postData.subreddit_name_prefixed;
    mainVid.play();
}

function getPrevVideo() {
    loopPos--;
    const postData = currentVideos[loopPos].data;
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

    if (moved > -150) {
        nextVidThumb.style = `transform: translateY(${150+moved}%);`;
    }
})

document.addEventListener('touchend', async function (e) {
    endY = e.changedTouches[0].clientY;
    console.log(endY - startY);
    if (endY - startY >= -150) {
        nextVidThumb.style = `transform: translateY(150%);`;
    }

    if (endY - startY <= -150) {
        vidTitle.style = 'color: gray;';

        const videoLoadedPromise = new Promise(resolve => {
            mainVid.addEventListener('canplaythrough', function () {
                resolve();
            });
        });

        await getNextVideo();
        await videoLoadedPromise;
        
        vidTitle.style = 'color: white;';
        nextVidThumb.style = `transform: translateY(150%);`;
        nextVidThumb.src = nextThumbnail;
        const nextBorderHeight = (window.innerHeight/2) - (nextVidThumb.clientHeight/2);
        nextVidThumb.style = `border-top: ${nextBorderHeight}px solid black; border-bottom: ${nextBorderHeight}px solid black;`;
    }

    if (endY - startY >= 150) {
        getPrevVideo();
    }
});