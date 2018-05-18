console.log("melee");
var elm = document.querySelector(".navBanner")[0];
elem.parentNode.removeChild(elem);
var images = document.getElementsByTagName('img');
for (var i = 0, l = images.length; i < l; i++) {
  images[i].src = 'http://placekitten.com/' + images[i].width + '/' + images[i].height;
}