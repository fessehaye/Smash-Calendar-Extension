var ggAPI = "https://api.smash.gg/tournament/";
var db = new PouchDB('smashCalendar');

var app = new Vue({
  el: '#app',
  data: {
    eventInput: 'pulsar-premier-league',
    addModal: false,
    edit:true,
    events:[],
    loading:false,
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
            startAt: tourney.startAt,
            endAt: tourney.endAt,
            city: tourney.city,
            state: tourney.addrState,
            logo: logo.url,
            registrationClosesAt: tourney.registrationClosesAt
        };
        // db.put(doc);
        self.events.push(doc);
        self.addModal = false;

    })
      .catch(function (error) {
        console.log("Error could not add event:" + error);

      });
    },

    toggleAddModal : function() {
        this.addModal = !this.addModal;
    },
  },

  filters: {
    moment: function (date) {
      return moment(date).format('MMMM Do YYYY, h:mm:ss a');
    }
  }

  

});

