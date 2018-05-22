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
                city: tourney.city || "",
                state: tourney.addrState || "",
                logo: logo.url,
                slug: tourney.slug,
                registrationClosesAt: tourney.registrationClosesAt
            };
            
            var eventIndex = self.events.findIndex((e) => {
                return e._id == doc._id;
            });

            if (eventIndex == -1) {
                self.events.push(doc);
                self.events = self.events.sort((a, b) => b.startAt > a.startAt );
                

                chrome.storage.sync.set({"smashCalendar": self.events}, function() {
                    console.log('Saved');
                });
            }
            else {
                self.addModal = false;
                document.getElementById('navMenu').classList.remove('is-active');
                document.querySelectorAll('.navbar-burger')[0].classList.remove('is-active');
                iziToast.error({
                    title: 'Event Already Added',    
                    maxWidth:250
                });
            }
            
            

        })
        .catch(function (error) {
            console.log("Error could not add event:" + error);
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

    deleteEvent: function (index) {
        this.events.splice(index, 1);
        chrome.storage.sync.set({"smashCalendar": this.events}, function() {
          console.log('Saved');
        });
        iziToast.error({
            title: 'Event Deleted!',    
            maxWidth:250
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

    happening: function(e) {
        var now = new Date();
        var start = new Date(e.startAt);
        var end = new Date(e.endAt);
        return start < now && now < end;
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

