var ggAPI = "https://api.smash.gg/tournament/";
var db = new PouchDB('smashCalendar');

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
            self.addModal = false;
            document.getElementById('navMenu').classList.remove('is-active');
            document.querySelectorAll('.navbar-burger')[0].classList.remove('is-active');

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
    },

    toggleAddModal : function() {
        this.addModal = !this.addModal;
    },
  },

  filters: {
    moment: function (date) {
      return moment(date).format('MMMM Do');
    }
  }

  

});

