const settings = JSON.parse(localStorage.getItem('settings'));

const searchBox = document.querySelector('#search-box');
const subSuggestions = document.querySelector('#subreddit-suggestions');

let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
const recentSearchList = document.querySelector('#recently-searched');

function search(search) {
    const params = new URLSearchParams(location.search);
    let searchSub;
    let searchTerm;

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

    if (recentSearches[0] != search) {
        recentSearches = [search].concat(recentSearches);
    }
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));

    window.location.href = "index.html?" + params.toString();
}

let typingTimer;
const pauseInterval = settings.searchSuggestionsInterval || 500;

searchBox.addEventListener('input', () => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout( async () => {
        subSuggestions.innerHTML = '';

        const response = await fetch(`https://api.reddit.com/api/search_reddit_names.json?query=${searchBox.value}&include_over_18=1`);
        const data = await response.json();
        const names = data.names;
        
        for (const index in names) {
            const suggestion = document.createElement('option');
            suggestion.value = `r/${names[index]}`;
            suggestion.textContent = `r/${names[index]}`;

            subSuggestions.appendChild(suggestion);
        }

    }, pauseInterval);
});

function removeRecentSearch(element, index) {
    recentSearches.splice(index, 1);
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    element.parentNode.parentNode.removeChild(element.parentNode);
}

function redirectToRecent(index) {
    search(recentSearches[index]);
}

function clearAllSearches() {
    if(confirm('Are you sure you want to clear all recent searches?')) {
        localStorage.setItem('recentSearches', JSON.stringify([]));
        recentSearchList.innerHTML = '';
    }
}


for (const index in recentSearches) {
    const recentSearchBox = document.createElement('div');
    recentSearchBox.classList.add('recent-search');

    const searchText = document.createElement('span');
    searchText.classList.add('recent-search-text');
    searchText.setAttribute('onclick', `redirectToRecent(${index});`); 
    searchText.textContent = recentSearches[index];

    const removeButton = document.createElement('button');
    removeButton.classList.add('material-symbols-outlined');
    removeButton.classList.add('remove-recent-search');
    removeButton.setAttribute('onclick', `removeRecentSearch(this, ${index});`); 
    removeButton.textContent = 'close';

    recentSearchBox.appendChild(searchText);
    recentSearchBox.appendChild(removeButton);

    recentSearchList.appendChild(recentSearchBox);
}