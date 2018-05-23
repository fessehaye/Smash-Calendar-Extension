

function addBookmark () {
    tabUrl = window.location.href;
    ggPage = tabUrl.includes('smash.gg/tournament/') || tabUrl.includes('smash.gg/league/');
    if(ggPage && !document.getElementById("bookmark-calendar-smash")){
        var btn = document.createElement("div");
        btn.className = "bookmark-button-smash-cal";
        btn.id = "bookmark-calendar-smash";
        var imgsrc = chrome.extension.getURL("bookmark.png");
        var img = document.createElement("img");
        img.src = imgsrc;
        btn.appendChild(img);
        btn.dataset.balloon = "Bookmark Event";
        btn.dataset.balloonPos = "up";
        document.body.appendChild(btn);

        document.getElementById("bookmark-calendar-smash").addEventListener("click", function () {
            var tourneySlug = 
                window.location.pathname.match(/(?<=tournament\/).[^\/]*(?=\/)/i) ||
                window.location.pathname.match(/(?<=tournament\/).[^\/]*/i) ||
                window.location.pathname.match(/(?<=league\/).[^\/]*(?=\/)/i) ||
                window.location.pathname.match(/(?<=league\/).[^\/]*/i);
            if(tourneySlug.length) {
                chrome.runtime.sendMessage({slug: tourneySlug[0]}, function(response) {
                        console.log('saved event');
                    }
                );
            } 
        });
    }

}

addBookmark();