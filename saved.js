let loopPos = -1;
let currentVideos = JSON.parse(localStorage.getItem('saved')) || [];;
let nextThumbnail;
let currentVideoData;

const mainVid = document.querySelector('#main-vid');

const vidTitle = document.querySelector('#vid-title');
const vidSubreddit = document.querySelector('#subreddit-text');
const vidAuthor = document.querySelector('#username-text');
const vidAgo = document.querySelector('#time-ago-text');

const upvoteText = document.querySelector('#upvote-amount');

const nextVidThumb = document.querySelector('#next-vid-thumb');

function getTimeAgo(utcTimestamp) {
    const currentDate = new Date();
    const timestampDate = new Date(utcTimestamp * 1000); // Convert to milliseconds

    const timeDifference = currentDate.getTime() - timestampDate.getTime();
    const secondsDifference = Math.round(timeDifference / 1000);

    if (secondsDifference < 60) {
        return "Just now";
    } else if (secondsDifference < 3600) {
        const minutes = Math.floor(secondsDifference / 60);
        return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    } else if (secondsDifference < 86400) {
        const hours = Math.floor(secondsDifference / 3600);
        return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    } else {
        const days = Math.floor(secondsDifference / 86400);
        return `${days} ${days === 1 ? "day" : "days"} ago`;
    }
}

async function getNextVideo() {
    loopPos++;
    const postData = currentVideos[loopPos];
    const redditMedia = postData.secure_media.reddit_video;
    currentVideoData = postData;
    nextThumbnail = currentVideos[loopPos + 1].preview.images[0].source.url.replace(/amp;/g, '');

    if (redditMedia) {
        mainVid.src = redditMedia.fallback_url;
    } else {
        mainVid.src = postData.preview.reddit_video_preview.fallback_url;
    }

    vidTitle.textContent = postData.title.replace(/amp;/g, '');
    vidTitle.href = "https://reddit.com" + postData.permalink;

    vidSubreddit.textContent = postData.subreddit_name_prefixed;
    vidSubreddit.href = `/?r=${postData.subreddit}`;

    vidAuthor.textContent = `@${postData.author}`;
    vidAuthor.href = `https://reddit.com/u/${postData.author}`;

    upvoteText.textContent = postData.score < 1000 ? postData.score : `${(postData.score / 1000).toFixed(1)}K`;

    vidAgo.textContent = `• ${getTimeAgo(postData.created)}`;

    mainVid.play();
    
    if (loopPos == 0) {
        await getNextVideo();
        nextVidThumb.style = `transform: translateY(100vh);`;
    }
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

    if (moved > -100) {
        nextVidThumb.style = `transform: translateY(${100+moved}vh);`;
    }
})

document.addEventListener('touchend', async function (e) {
    endY = e.changedTouches[0].clientY;
    console.log(endY - startY);
    if (endY - startY >= -100) {
        nextVidThumb.style = `transform: translateY(100vh);`;
    }

    if (endY - startY <= -100) {
        vidTitle.style = 'color: gray;';

        const videoLoadedPromise = new Promise(resolve => {
            mainVid.addEventListener('canplaythrough', function () {
                resolve();
            });
        });

        await getNextVideo();
        await videoLoadedPromise;
        
        vidTitle.style = 'color: white;';
        nextVidThumb.style = `transform: translateY(100vh);`;
        nextVidThumb.src = nextThumbnail;
        const nextBorderHeight = (window.innerHeight/2) - (nextVidThumb.getBoundingClientRect().height/2) + nextVidThumb.getBoundingClientRect().top;
        document.documentElement.style.setProperty('--next-border-height', `${nextBorderHeight}px`);
    }

    if (endY - startY >= 100) {
        getPrevVideo();
    }
});