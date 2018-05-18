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

var app = new Vue({
  el: '#app',
  data: {
    eventInput: 'pound-underground',
    addModal: false,
    edit:true,
    events:[],
    loading:false,
    tabs:{
        allEvents: true,
        prevEvents: false,
        upcomingEvents: false
    }
  },

  created : function() {
    chrome.storage.sync.get(["smashCalendar"], (result) => {
      if(result.smashCalendar){
        this.events = result.smashCalendar;
      }
    });

    chrome.tabs.getSelected(null, function(tab) {
        tabUrl = tab.url;
        ggPage = tabUrl.includes('smash.gg/');
        if(ggPage){
            var opt = {
                type: 'list',
                title: 'Visiting Event Page',
                message: 'Primary message to display',
                priority: 1,
            };
            chrome.notifications.create('notify1', opt, function(id) { console.log("Last error:", chrome.runtime.lastError); });
        }
    });
  },

  methods: {
    addEvent:function () {
        var self = this;
        axios.get('https://api.smash.gg/tournament/' + this.eventInput)
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
                city: tourney.city,
                state: tourney.addrState,
                logo: logo.url,
                slug: tourney.slug,
                registrationClosesAt: tourney.registrationClosesAt
            };
            // db.put(doc);
            
            self.events.push(doc);
            self.events = self.events.sort((a, b) => a.startAt > b.startAt );
            self.addModal = false;
            document.getElementById('navMenu').classList.remove('is-active');
            document.querySelectorAll('.navbar-burger')[0].classList.remove('is-active');

            chrome.storage.sync.set({"smashCalendar": self.events}, function() {
              console.log('Saved');
            });

        })
        .catch(function (error) {
            console.log("Error could not add event:" + error);
        });
    },

    copyEvent: function (event) {
        copyToClipboard("https://smash.gg/" + event.slug );
    },

    deleteEvent: function (index) {
        this.events.splice(index, 1);
        chrome.storage.sync.set({"smashCalendar": this.events}, function() {
          console.log('Saved');
        });
    },

    toggleAddModal : function() {
        this.addModal = !this.addModal;
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

    filteredEvents: function () {
      // `this` points to the vm instance
      if(this.tabs.prevEvents) {
        return this.events.filter((e) => {
            var now = new Date();
            var event = new Date(e.endAt);
            return event < now;
        })
      }
      else if(this.tabs.upcomingEvents) {
        return this.events.filter((e) => {
            var now = new Date();
            var event = new Date(e.endAt);
            return event > now;
        })
      }
      else {
          return this.events;
      }

    }
  },

  filters: {
    moment: function (date) {
      return moment(date).format('MMMM Do');
    }
  },
  

});

