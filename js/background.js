
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {

        if(request.slug){
            addEvent(request.slug);
        }
       
    }
);

function addEvent(slug){
    chrome.storage.sync.get(["smashCalendar"], (result) => {
        var events = [];
        if(result.smashCalendar){
            events = result.smashCalendar;
        }

        axios.get('https://api.smash.gg/tournament/' + slug )
        .then(function (response) {
            var tourney = response.data.entities.tournament;
            var logo = tourney.images.filter((img) => {
                return img.type == "profile"
            })[0];
            var doc = {
                _id: tourney.shortSlug,
                name: tourney.name,
                startAt: tourney.startAt * 1000,
                endAt: tourney.endAt * 1000,
                city: tourney.city || "",
                state: tourney.addrState || "",
                logo: logo.url,
                slug: tourney.slug,
                registrationClosesAt: tourney.registrationClosesAt * 1000
            };
            
            var eventIndex = events.findIndex((e) => {
                return e._id == doc._id;
            });

            if(eventIndex == -1) {
                events.push(doc);
                events = events.sort((a, b) => b.startAt > a.startAt );
                chrome.storage.sync.set({"smashCalendar": events}, function() {
                    console.log('synced');
                });
                var iconUrl = chrome.extension.getURL("Calendar-128.png");
                var opt = {
                    type: 'basic',
                    title: 'Added Event',
                    message: doc.name + ' is now added',
                    iconUrl:iconUrl
        
                };
                chrome.notifications.create('id', opt, function(id) {});
            }

            else {
                var iconUrl = chrome.extension.getURL("Calendar-128.png");
                var opt = {
                    type: 'basic',
                    title: 'Error',
                    message: 'Event already included',
                    iconUrl:iconUrl
        
                };
                chrome.notifications.create('id', opt, function(id) {});
            }
            

        })
        .catch(function (error) {
            console.log("Error could not add event:" + error);
        });
    });
}