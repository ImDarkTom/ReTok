const settings = JSON.parse(localStorage.getItem('settings'));
let saved = JSON.parse(localStorage.getItem('saved')) || [];

let loopPos = -1;
let currentVideos = saved;
let nextFullname = "";
let nextThumbnail;
let currentVideoData;

const mainVid = document.querySelector('#main-vid');
const nextVidPreload = document.querySelector('#next-video-preload');

const vidTitle = document.querySelector('#vid-title');
const vidSubreddit = document.querySelector('#subreddit-text');
const vidAuthor = document.querySelector('#username-text');
const vidAgo = document.querySelector('#time-ago-text');

const upvoteText = document.querySelector('#upvote-amount');
const commentText = document.querySelector('#comment-amount');

const commentButton = document.querySelector('#comment-box');

const saveIcon = document.querySelector('#save-symbol');

const nextVidThumb = document.querySelector('#next-vid-thumb');
const notificationText = document.querySelector('#notification-text');

const commentPopup = document.querySelector('#comment-popup');
const commentList = document.querySelector('#comment-list');

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

function SaveVideo() {
    if (saved.find(obj => obj.id === currentVideoData.id)) {
        saved = saved.filter(obj => obj.id !== currentVideoData.id);
        saveIcon.textContent = 'bookmark_add';
    } else {
        saved.push(currentVideoData);
        saveIcon.textContent = 'bookmark_remove';
    }

    localStorage.setItem('saved', JSON.stringify(saved));
}

//Comments
let commentsOpen = false;

async function OpenComments() {
    mainVid.pause();
    commentsOpen = true;
    commentList.innerHTML = '';
    commentPopup.style.transform = `translateY(0%)`;

    const response = await fetch(`https://www.reddit.com${currentVideoData.permalink}.json`);
    const data = await response.json();
    const comments = data[1].data.children;

    for (const commentIndex in comments) {
        const commentData = comments[commentIndex].data;

        const response = await fetch(`https://www.reddit.com/user/${commentData.author}/about.json`);
        const data = await response.json();
        const pfpURL = data.data.icon_img.replace(/amp;/g, '');

        CreateComment(commentData.id, pfpURL, commentData.author, commentData.body);
    }
}

function CloseComments() {
    mainVid.play();
    commentPopup.style.transform = `translateY(100%)`;
    commentsOpen = false;
}

function CreateComment(id, pfp, author, body) {
    const mainComment = document.createElement('div');
    mainComment.classList.add('comment');
    mainComment.id = id;

    const pfpImage = document.createElement('img');
    pfpImage.src = pfp;
    pfpImage.classList.add('comment-profile-picture');
    pfpImage.alt = `${author}'s Profile Picture`;

    const textDiv = document.createElement('div');
    textDiv.classList.add('comment-text');

    const authorText = document.createElement('b');
    authorText.classList.add('comment-author');
    authorText.textContent = author;

    const bodyText = document.createElement('p');
    bodyText.classList.add('comment-body');
    bodyText.textContent = body;

    textDiv.appendChild(authorText);
    textDiv.appendChild(bodyText);

    mainComment.appendChild(pfpImage);
    mainComment.appendChild(textDiv);

    commentList.appendChild(mainComment);
}


//Video
function loadVideo(vidData, nextVidData) {
    const redditMedia = vidData.secure_media.reddit_video;

    if (redditMedia) {
        mainVid.src = redditMedia.fallback_url;
    } else {
        mainVid.src = vidData.preview.reddit_video_preview.fallback_url;
    }

    vidTitle.textContent = vidData.title.replace(/amp;/g, '');
    vidTitle.href = "https://reddit.com" + vidData.permalink;

    vidSubreddit.textContent = vidData.subreddit_name_prefixed;
    vidSubreddit.href = `/?r=${vidData.subreddit}`;

    vidAuthor.textContent = `@${vidData.author}`;
    vidAuthor.href = `https://reddit.com/u/${vidData.author}`;

    upvoteText.textContent = vidData.score < 1000 ? vidData.score : `${(vidData.score / 1000).toFixed(1)}K`;
    commentText.textContent = vidData.num_comments.toLocaleString();

    if (saved.find(obj => obj.id === currentVideoData.id)) {
        saveIcon.textContent = 'bookmark_remove';
    } else {
        saveIcon.textContent = 'bookmark_add';
    }

    vidAgo.textContent = `• ${getTimeAgo(vidData.created)}`;

    nextVidThumb.src = nextVidData.preview.images[0].source.url.replace(/amp;/g, '');

    mainVid.play();
}

async function getNextVideo() {
    loopPos++;
    try {
        currentVideoData = currentVideos[loopPos];
        nextVideoData = currentVideos[loopPos + 1];

        loadVideo(currentVideoData, nextVideoData);

    } finally {
        if (loopPos == 0) {
            await getNextVideo();
            nextVidThumb.style = `transform: translateY(100vh);`;
        }

        if (!settings.preloadNextVid) {
            return;
        }

        const nextRedditMedia = nextVideoData.secure_media.reddit_video;

        if (nextRedditMedia) {
            nextVidPreload.src = nextRedditMedia.fallback_url;
        } else {
            nextVidPreload.src = nextRedditMedia.preview.reddit_video_preview.fallback_url;
        }

        nextVidPreload.load();
    }
}

function getPrevVideo() {
    loopPos--;
    loadVideo(currentVideoData, nextVideoData);
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

    if (moved > -100 && !commentsOpen) {
        nextVidThumb.style = `transform: translateY(${100 + moved}vh);`;
    }
})

document.addEventListener('touchend', async function (e) {
    endY = e.changedTouches[0].clientY;
    if (!commentsOpen) {
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
            const nextBorderHeight = (window.innerHeight / 2) - (nextVidThumb.getBoundingClientRect().height / 2) + nextVidThumb.getBoundingClientRect().top;
            document.documentElement.style.setProperty('--next-border-height', `${nextBorderHeight}px`);
        }

        if (endY - startY >= 100) {
            getPrevVideo();
        }
    }
});