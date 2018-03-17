var HOURS = 60 * 60 * 1000;
var steem_price = 1;
var sbd_price = 1;

function getCurrency(amount) {
  return amount.substr(amount.indexOf(' ') + 1);
}

function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [, ""])[1].replace(/\+/g, '%20')) || null;
}

function getUsdValue(bid) {
  if(bid.currency)
    return parseFloat(bid.amount) * ((bid.currency == 'SBD') ? sbd_price : steem_price);
  else
    return parseFloat(bid.amount) * ((getCurrency(bid.amount) == 'SBD') ? sbd_price : steem_price);
}

function toTimer(ts) {
  var h = Math.floor(ts / HOURS);
  var m = Math.floor((ts % HOURS) / 60000);
  var s = Math.floor((ts % 60000) / 1000);
  return h + ':' + padLeft(m, 2) + ':' + padLeft(s, 2);
}

function padLeft(v, d) {
  var l = (v + '').length;
  if (l >= d) return v + '';
  for(var i = l; i < d; i++)
    v = '0' + v;
  return v;
}

function updateTimers() {
  var timers = $('.timer');

  for (var i = 0; i < timers.length; i++) {
    var timer = $(timers[i]);
    if(!timer.attr('time')) return;

    var time = parseInt(timer.attr('time'));

    if(timer.attr('dir') == 'up')
      time += 1000;
    else
      time = Math.max(time - 1000, 0);

    timer.attr('time', time);
    timer.text(toTimer(time));
  }
}

Number.prototype.formatMoney = function(c, d, t){
var n = this,
    c = isNaN(c = Math.abs(c)) ? 2 : c,
    d = d == undefined ? "." : d,
    t = t == undefined ? "," : t,
    s = n < 0 ? "-" : "",
    i = String(parseInt(n = Math.abs(Number(n) || 0).toFixed(c))),
    j = (j = i.length) > 3 ? j % 3 : 0;
   return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
 };

$(document).ready(function() {
  //Center modal function
  $('.modal.modal-center').on('show.bs.modal', function (e) {
    $('.modal.modal-center').each(function(){
      if($(this).hasClass('in') == false){
        $(this).show();
      };
      var contentHeight = $(window).height() - 60;
      var headerHeight = $(this).find('.modal-header').outerHeight() || 2;
      var footerHeight = $(this).find('.modal-footer').outerHeight() || 2;

      $(this).find('.modal-content').css({
        'max-height': function () {
          return contentHeight;
        }
      });

      $(this).find('.modal-body').css({
        'max-height': function () {
          return contentHeight - (headerHeight + footerHeight);
        }
      });

      $(this).find('.modal-dialog').addClass('modal-dialog-center').css({
        'margin-top': function () {
          return -($(this).outerHeight() / 2);
        },
        'margin-left': function () {
          return -($(this).outerWidth() / 2);
        }
      });
      if($(this).hasClass('in') == false){
        $(this).hide();
      };
    });
  });
});
