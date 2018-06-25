var ggAPI = "https://api.smash.gg/tournament/";

const copyToClipboard = str => {
  const el = document.createElement('textarea');
  el.value = str;
  el.setAttribute('readonly', '');
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  document.body.appendChild(el);
  const selected =
    document.getSelection().rangeCount > 0 ? document.getSelection().getRangeAt(0) : false;
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
  if (selected) {
    document.getSelection().removeAllRanges();
    document.getSelection().addRange(selected);
  }
};

iziToast.settings({
    timeout: 1500,
});

const getSlug = link => {
    var tourneySlug =
        link.match(/(?<=tournament\/).[^\/]*(?=\/)/i) ||
        link.match(/(?<=tournament\/).[^\/]*/i) ||
        link.match(/(?<=league\/).[^\/]*(?=\/)/i) ||
        link.match(/(?<=league\/).[^\/]*/i);

    return tourneySlug.length ? tourneySlug[0] : null;
};

var app = new Vue({
  el: '#app',
  data: {
    eventInput: 'https://smash.gg/tournament/shine-2018',
    addModal: false,
    showMenu:false,
    edit:true,
    events:[],
    loading:false,
    streamEvent:null,
    streamData: null,
    streamLoading: false,
    filterText: "",
    tabs:{
        allEvents: false,
        prevEvents: false,
        upcomingEvents: true
    }
  },

  created : function() {

    chrome.storage.sync.get(["smashCalendar"], (result) => {
      if(result.smashCalendar){
        this.events = result.smashCalendar;
      }
    });

  },

  methods: {
    addEvent:function () {
        var self = this;
        var slug = getSlug(this.eventInput);
        axios.get('https://api.smash.gg/tournament/' + slug)
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
                registrationClosesAt: tourney.registrationClosesAt * 1000
            };
            
            var eventIndex = self.events.findIndex((e) => {
                return e._id == doc._id;
            });

            if (eventIndex == -1) {
                self.events.push(doc);
                self.events.sort((a, b) => b.startAt > a.startAt );
                self.addModal = false;
                self.showMenu = false;
                chrome.storage.sync.set({"smashCalendar": self.events}, function() {
                    console.log('Saved');
                });
                iziToast.success({
                    title: doc.name + ' Added!',    
                    maxWidth:250
                });
            }
            else {
                self.addModal = false;
                self.showMenu = false;
                iziToast.error({
                    title: 'Event Already Added',    
                    maxWidth:250
                });
            }
        })
        .catch(function (error) {
            console.log("Error could not add event:" + error);
            iziToast.error({
                title: "Error could not add event:" + error,    
                maxWidth:250
            });
        });
    },

    copyEvent: function (event) {
        copyToClipboard("https://smash.gg/" + event.slug );
        iziToast.info({
            title: 'Event Link Copied!',    
            maxWidth:250
        });
    },

    linkEvent: function (event) {
        chrome.tabs.create({url: "https://smash.gg/" + event.slug });
    },

    openFB: function (e) {
        if(e && e.fb) {
            chrome.tabs.create({url: e.fb });
        } 
    },

    addToCal: function (e) {
        var glink = `http://www.google.com/calendar/event?` +
        'action=TEMPLATE' +
        `&text=${encodeURIComponent(e.name)}` +
        `&dates=${encodeURIComponent((new Date(e.startAt)).toISOString().replace(/-|:|\.\d\d\d/g,""))}` +
        `/${encodeURIComponent((new Date(e.endAt)).toISOString().replace(/-|:|\.\d\d\d/g,""))}` +
        `&details=${encodeURIComponent("https://smash.gg/" + e.slug)}` +
        `&location=${encodeURIComponent(e.venue)}` +
        `&trp=false` +
        `&sprop=` +
        `&sprop=name:`;
        chrome.tabs.create({url: glink });
    },

    deleteEvent: function (index) {
        this.events.splice(index, 1);
        chrome.storage.sync.set({"smashCalendar": this.events}, function() {
          console.log('Saved');
        });
        iziToast.error({
            title: 'Event Deleted!',    
            maxWidth: 250,
            timeout: 1500
        });
    },

    toggleAddModal : function() {
        this.addModal = !this.addModal;
    },

    toggleMenu : function() {
        this.showMenu = !this.showMenu;
    },

    toggleStream : function (event) {
        if(event){
            this.streamEvent = event._id;
            this.streamLoading = true;
            axios.get('https://api.smash.gg/station_queue/' + event._id)
            .then((response) => {
                var station = response.data.data;
                var streams = station &&
                station.entities ?
                    response.data.data.entities.stream : [];
                this.streamData = Array.isArray(streams) ?
                    streams :
                    [streams];
                this.streamLoading = false;
            })
            .catch(function (error) {
                console.log("Error could find streams:" + error);
                iziToast.error({
                    title: "Error could find streams:" + error,    
                    maxWidth:250
                });
                this.streamLoading = false;
            });
        }
        else {
            this.streamEvent = null;
        }
    },

    changeTab: function(tabName) {
        Object.keys(this.tabs).forEach((key,index) => {
            if(tabName == key) {
                this.tabs[key] = true;
            }
            else {
                this.tabs[key] = false;
            }
        });
    },

    github: function() {
        chrome.tabs.create({url: "https://github.com/fessehaye/Smash-Calendar-Extension"});
    },

    goToStream: function(stream) {
        chrome.tabs.create({url: "https://twitch.tv/" + stream.streamName});
    },

    happening: function(e) {
        var now = new Date();
        var start = new Date(e.startAt);
        var end = new Date(e.endAt);
        return start < now && now < end;
    },

    sameDay: function(e) {
        
        var start = new Date(e.startAt);
        var end = new Date(e.endAt);
        return start.getFullYear() === end.getFullYear() &&
        start.getMonth() === end.getMonth() &&
        start.getDate() === end.getDate();
    },

    upcoming: function(e) {
    
        var regDate = new Date(e.registrationClosesAt);
        var nowDate = new Date();
        if(nowDate > regDate) {
            return null;
        }
        var now = moment();
        var reg = moment(regDate);
        return e.registrationClosesAt ? now.to(reg) : null;
    },

    filteredEvents: function () {
      // `this` points to the vm instance
      let eventList = [];
      
      if(this.tabs.prevEvents) {
        eventList = this.events.filter((e) => {
            var now = new Date();
            var event = new Date(e.endAt);
            return event < now;
        })
        .filter((e) => {
            return this.filterText ?
                e.name.toUpperCase().includes(this.filterText.toUpperCase()) :
                true
        })
      }
      else if(this.tabs.upcomingEvents) {
        eventList = this.events.filter((e) => {
            var now = new Date();
            var event = new Date(e.endAt);
            return event > now;
        })
        .filter((e) => {
            return this.filterText ?
                e.name.toUpperCase().includes(this.filterText.toUpperCase()) :
                true
        })
      }
      else {
        eventList = this.events.filter((e) => {
            return this.filterText ?
                e.name.toUpperCase().includes(this.filterText.toUpperCase()) :
                true
        })
      }

      eventList.sort((a, b) => b.startAt < a.startAt );
      return eventList;
    }
  },

  filters: {
    moment: function (date) {
      return moment(date).format('MMMM Do');
    }
  },
  

});

