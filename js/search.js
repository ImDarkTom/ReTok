const searchBox = document.querySelector('#search-box');

const recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];

function search() {
    const search = searchBox.value.trim();
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

    recentSearches.push(searchTerm);
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));

    window.location.href = "index.html?" + params.toString();
}