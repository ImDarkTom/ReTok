const params = new URLSearchParams(new URL(window.location.toLocaleString()).search);
const subreddit = params.get('r');
const query = params.get('q');

let nextVideos = [];
let loopPos = -1;
let currentVideos = [];
let nextFullname = "";
let nextThumbnail;
let currentVideoData;

const mainVid = document.querySelector('#main-vid');

const vidTitle = document.querySelector('#vid-title');
const vidSubreddit = document.querySelector('#subreddit-text');
const vidAuthor = document.querySelector('#username-text');
const vidAgo = document.querySelector('#time-ago-text');

const upvoteText = document.querySelector('#upvote-amount');

const nextVidThumb = document.querySelector('#next-vid-thumb');
const notificationText = document.querySelector('#notification-text');
const searchInput = document.querySelector('#search-box');

if (subreddit) {
    searchInput.value = `r/${subreddit} ${query}`;
} else {
    searchInput.value = query;
}

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


function notification(content) {
    notificationText.textContent = content;
    notificationText.style.visibility = 'unset';
    setTimeout(() => {
        notificationText.style.visibility = 'hidden';
    }, 1000);
}

let saveToggle = false;

function saveVideo() {
    if (saveToggle) {
        let list = JSON.parse(localStorage.getItem('saved')) || [];
        notification('Saved video');

        list.push(currentVideoData);

        localStorage.setItem('saved', JSON.stringify(list));
        console.log('saved');

        saveToggle = false;
    } else {
        saveToggle = true;
    }
}

searchInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        const search = searchInput.value.trim();
        const params = new URLSearchParams(location.search);
        let searchSub;
        let searchTerm;
        
        if (search == `r/${subreddit} ${query}`) {
            return;
        }

        if (search.substring(0, 2) == "r/") {
            const formattedSearch = search.split(/ (.*)/s);
            searchSub = formattedSearch[0].replace('r/', '');
            searchTerm = formattedSearch[1];
        } else {
            searchTerm = search;
        }

        if (searchSub) {
            params.set('r', searchSub);
        } else {
            params.set('r', '');
        }

        if (searchTerm) {
            params.set('q', searchTerm);
        } else {
            params.set('q', '');
        }
        window.location.href = "?" + params.toString();
    }
});

async function getNextVideo() {
    loopPos++;
    try {
        const postData = currentVideos[loopPos].data;
        const redditMedia = postData.secure_media.reddit_video;
        currentVideoData = postData;
        nextThumbnail = currentVideos[loopPos+1].data.preview.images[0].source.url.replace(/amp;/g, '');

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

        upvoteText.textContent = postData.score < 1000 ? postData.score : `${(postData.score/1000).toFixed(1)}K`;

        vidAgo.textContent = `• ${getTimeAgo(postData.created)}`;

        mainVid.play();
    } finally {
        if (loopPos >= currentVideos.length - 1 || currentVideos.length == 0) {
            const url = `https://www.reddit.com/search.json?q=${subreddit ? `subreddit:${subreddit}` : ''} ${query ? `${query}` : ''} type:video&include_over_18=1&limit=25&after=${nextFullname}`;
            const response = await fetch(url);
            const data = await response.json();

            const fetchVideos = data.data.children;
            nextFullname = data.data.after;
            currentVideos = currentVideos.concat(fetchVideos);
        }
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
        const nextBorderHeight = (window.innerHeight/2) - (nextVidThumb.getBoundingClientRect().height/2) + nextVidThumb.getBoundingClientRect().top;
        document.documentElement.style.setProperty('--next-border-height', `${nextBorderHeight}px`);
    }

    if (endY - startY >= 150) {
        getPrevVideo();
    }
});