
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {

        if(request.slug){
            addEvent(request.slug);
        }
       
    }
);

function addEvent(slug){
    chrome.storage.local.get(["smashCalendar"], (result) => {
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
                _id: tourney.id,
                name: tourney.name,
                startAt: tourney.startAt * 1000,
                endAt: tourney.endAt * 1000,
                city: tourney.city || "",
                state: tourney.addrState || "",
                logo: logo.url,
                slug: tourney.slug,
                venue:tourney.venueAddress,
                fb:tourney.links.facebook || "",
                registrationClosesAt: tourney.eventRegistrationClosesAt * 1000
            };
            
            var eventIndex = events.findIndex((e) => {
                return e._id == doc._id;
            });

            if(eventIndex == -1) {
                events.push(doc);
                
                chrome.storage.local.set({"smashCalendar": events}, function() {
                    console.log('synced');
                });
                var iconUrl = chrome.extension.getURL("img/Calendar-128.png");
                var opt = {
                    type: 'basic',
                    title: 'Added Event',
                    message: doc.name + ' is now added',
                    iconUrl:iconUrl  
                };
                
                chrome.notifications.create('id', opt, function(id) {});
            }

            else {
                var iconUrl = chrome.extension.getURL("img/Calendar-128.png");
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