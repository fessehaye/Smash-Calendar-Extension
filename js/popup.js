const debounce = (fn, ms = 0) => {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), ms);
    };
  };

const uniqueElementsBy = (arr, fn) =>
  arr.reduce((acc, v) => {
    if (!acc.some(x => fn(v, x))) acc.push(v);
    return acc;
  }, []);

var app = new Vue({
  el: '#app',
  data: {
    eventInput: 'https://smash.gg/tournament/shine-2018',
    addModal: false,
    exportModal: false,
    importModal: false,
    importText:"", 
    showMenu:false,
    edit:true,
    events:[],
    streamEvent:null,
    streamData: null,
    streamLoading: false,
    filterText: "",
    isFiltering: false,
    tabs:{
        allEvents: false,
        prevEvents: false,
        upcomingEvents: true
    }
  },

  created : function() {

    chrome.storage.local.get(["smashCalendar"], (result) => {
      try {
        if(result.smashCalendar){
            this.events = result.smashCalendar;
        }
      }
      catch (error) {
        console.log(error);    
      }
      
    });

    this.updateInput = debounce((text) => {
        this.filterText = text;
        this.isFiltering = false;
    }, 500);

  },

  computed: {
    filteredEvents: function () {
        let eventList = this.events;
        
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
          return eventList.sort((a, b) => b.startAt < a.startAt );
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
  
          return eventList.sort((a, b) => b.startAt < a.startAt );
        }
        else {
          eventList = this.events.filter((e) => {
              return this.filterText ?
                  e.name.toUpperCase().includes(this.filterText.toUpperCase()) :
                  true
          })
  
           return eventList.sort((a, b) => b.startAt > a.startAt );
        }
        
      }
    },

  methods: {
    debounceInput: function(e) {
        this.isFiltering = true;
        this.updateInput(e.target.value);
    },

    processFile(event) { 
        var reader = new FileReader();
        reader.onload = this.onReaderLoad;
        reader.readAsText(event.target.files[0]);
    },

    deleteAll() {
        var self = this;
        iziToast.question({
            timeout: 20000,
            close: false,
            overlay: true,
            displayMode: 'once',
            id: 'error',
            zindex: 999,
            title: 'Hey',
            message: 'Are you sure about that?',
            position: 'center',
            buttons: [
                ['<button><b>YES</b></button>', function (instance, toast) {
         
                    
                    chrome.storage.local.set({"smashCalendar": []}, function() {
                        console.log('Clear');
                        self.importModal = false;
                        self.showMenu = false;
                        iziToast.success({
                            title: 'Removed Events',    
                            maxWidth:250
                        });
                        self.events = [];
                        instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
                    });
                    
         
                }, true],
                ['<button>NO</button>', function (instance, toast) {
         
                    instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
         
                }],
            ]
        });
    },

    onReaderLoad(event){
        
        try {
            var newEvents = JSON.parse(event.target.result);
          
            this.events = uniqueElementsBy([...this.events,...newEvents],(a, b) => a._id == b._id);
            var self = this;
            chrome.storage.local.set({"smashCalendar": this.events}, function() {
                console.log('Saved');
                self.importModal = false;
                self.showMenu = false;
                iziToast.success({
                    title: 'Imported Events',    
                    maxWidth:250
                });
            });
        } 
        catch (error) {
            console.log("Error could not add event:" + error);
            iziToast.error({
                title: "Error could not add event:" + error,    
                maxWidth:250
            });
        }
        
    },

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
                registrationClosesAt: tourney.eventRegistrationClosesAt * 1000
            };
            
            var eventIndex = self.events.findIndex((e) => {
                return e._id == doc._id;
            });

            if (eventIndex == -1) {
                self.events.push(doc);
                
                self.addModal = false;
                self.showMenu = false;
                chrome.storage.local.set({"smashCalendar": self.events}, function() {
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

    copyExport: function() {
        copyToClipboard(JSON.stringify(this.events));
        iziToast.success({
            title: 'Copied Export',    
            maxWidth:250
        });
    },

    toggleAddModal : function() {
        this.addModal = !this.addModal;
    },

    toggleExport : function() {
        let dataStr = JSON.stringify(this.events);
        let dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        let exportFileDefaultName = 'events.ggCal';
        
        let linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    },

    toggleImport : function() {
        this.importModal = !this.importModal;
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

    deleteEvent: function (event) {
        this.events = this.events.filter(e => e._id !== event._id);
        
        chrome.storage.local.set({"smashCalendar": this.events}, function() {
          console.log('Saved');
          iziToast.error({
            title: 'Event Deleted!',    
            maxWidth: 250,
            timeout: 1500
          });
        });
        
    },

  } 
  

});

