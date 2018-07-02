const ggAPI = "https://api.smash.gg/tournament/";

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

Vue.component('stream-channel', {
    props: ['stream'],
    template: `
      <div class="box" @click="goToStream(stream)">
        <article class="media">
            <div class="media-left">
                <figure class="image is-64x64">
                <img v-bind:src="stream.streamLogo || 'img/twitch-icon.png' " alt="Image">
                </figure>
            </div>
            <div class="media-content">
                <div class="content">
                <p>
                    <strong>{{stream.streamName}}</strong> <small>{{stream.updatedAt * 1000 | moment }}</small>
                    <br>
                    {{stream.streamStatus}}
                    <br>
                    Game: {{stream.streamGame}}
                </p>
                </div>
            </div>
        </article>
      </div>
    `,
    methods: {
        goToStream: function(stream) {
            chrome.tabs.create({url: "https://twitch.tv/" + stream.streamName});
        },
    }
});

Vue.component('tourney-event', {
    props: ['event','isupcoming'],
    template: `
    <article class="media event">
        <figure class="media-left">
            <p class="image is-64x64 event-logo">
                <img v-bind:src="event.logo || 'img/smash-icon.png'" @click="linkEvent(event)">
            </p>
        </figure>
        <div class="media-content">
            <div class="content">
                <p>
                    <strong @click="linkEvent(event)">
                        {{event.name}}
                        <span class="icon has-text-info" data-balloon="Happening Now" data-balloon-pos="down" v-if="happening(event)">
                            <i class="fas fa-exclamation-circle"></i>
                        </span>
                    </strong>
                    <br/>
                    <span>{{event.startAt | moment}}<span v-if="!sameDay(event)">-{{event.endAt | moment}}</span></span> 
                    <br/>
                    <span>{{event.city}}{{event.city ? ',' : ''}} {{event.state}}</span>
                    <br/>
                    <span v-if="upcoming(event) && isupcoming">Registration ends {{upcoming(event)}}</span>
                </p>
            </div>
        </div>
        <div class="media-right">
            <div class="list-icons">
                <span class="icon has-text-info" data-balloon="Copy Event Link" data-balloon-pos="left" @click="copyEvent(event)">
                    <i class="fas fa-paste"></i>
                </span>

                <div class="dropdown is-hoverable is-right">
                    <div class="dropdown-trigger">
                        <button class="button d-button" aria-haspopup="true" aria-controls="dropdown-menu4">
                            <span class="icon is-small">
                                <i class="fas fa-ellipsis-v" aria-hidden="true"></i>
                            </span>
                        </button>
                    </div>
                    <div class="dropdown-menu" role="menu">
                        <div class="dropdown-content">
                            <div class="dropdown-item" @click="$emit('delete-event')">
                                <p class="list-options"><i class="fas fa-trash-alt has-text-danger"></i> Delete Event</p>
                            </div>
                            <hr class="dropdown-divider">
                            <div class="dropdown-item" @click="toggleStream(event)">
                                <p class="list-options"><i class="fab fa-twitch twitch-icon"></i> Find Streams</p>
                            </div>
                            <hr class="dropdown-divider">
                            <div class="dropdown-item" @click="addToCal(event)">
                                <p class="list-options"><i class="fab fa-google"></i> Add to Calendar</p>
                            </div>
                            <hr class="dropdown-divider" v-if="event.fb">
                            <div class="dropdown-item" @click="openFB(event)" v-if="event.fb">
                                <p class="list-options"><i class="fab fa-facebook-square fb-icon"></i> Facebook Event</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </article>
    `,
    methods: {
        happening: function(e) {
            var now = new Date();
            var start = new Date(e.startAt);
            var end = new Date(e.endAt);
            return start < now && now < end;
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
    
        sameDay: function(e) {  
            var start = new Date(e.startAt);
            var end = new Date(e.endAt);
            return start.getFullYear() === end.getFullYear() &&
            start.getMonth() === end.getMonth() &&
            start.getDate() === end.getDate();
        },

        copyEvent: function (e) {
            copyToClipboard("https://smash.gg/" + e.slug );
            iziToast.info({
                title: 'Event Link Copied!',    
                maxWidth:250
            });
        },
    
        linkEvent: function (e) {
            chrome.tabs.create({url: "https://smash.gg/" + e.slug });
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
    
    },

    filters: {
        moment: function (d) {
            return moment(d).format('MMMM Do');
        }
    },
});