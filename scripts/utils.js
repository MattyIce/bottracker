var STEEMIT_100_PERCENT = 10000;
var STEEMIT_VOTE_REGENERATION_SECONDS = (5 * 60 * 60 * 24);
var HOURS = 60 * 60 * 1000;
var steem_price = 1;
var sbd_price = 1;
var token_prices = {};

function getCurrency(amount) {
  return amount.substr(amount.indexOf(' ') + 1);
}

function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [, ""])[1].replace(/\+/g, '%20')) || null;
}

function getUsdValue(bid) {
	if(['SBD', 'STEEM'].includes(bid.currency))
  	return parseFloat(bid.amount) * ((bid.currency == 'SBD') ? sbd_price : steem_price);
  else
    return parseFloat(bid.amount) * token_prices[bid.currency] * steem_price;
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

var steemPrice;
var rewardBalance;
var recentClaims;
var currentUserAccount;
var votePowerReserveRate;
var totalVestingFund;
var totalVestingShares;
var steem_per_mvests;

function updateSteemVariables(callback) {
	steem.api.getRewardFund("post", function (e, t) {
		rewardBalance = parseFloat(t.reward_balance.replace(" STEEM", ""));
		recentClaims = t.recent_claims;

		steem.api.getCurrentMedianHistoryPrice(function (e, t) {
			steemPrice = parseFloat(t.base.replace(" SBD", "")) / parseFloat(t.quote.replace(" STEEM", ""));
		
			steem.api.getDynamicGlobalProperties(function (e, t) {
				 votePowerReserveRate = t.vote_power_reserve_rate;
				 totalVestingFund = parseFloat(t.total_vesting_fund_steem.replace(" STEEM", ""));
				 totalVestingShares = parseFloat(t.total_vesting_shares.replace(" VESTS", ""));

				 var tVFS = t.total_vesting_fund_steem.replace(' STEEM', '');
				 var tVS = t.total_vesting_shares.replace(' VESTS', '');
				 steem_per_mvests = ((tVFS / tVS) * 1000000);
				 
				 if(callback)
					 callback();
			});
		});
	});
	 setTimeout(updateSteemVariables, 10 * 60 * 1000)
}

function getVotingPower(account) {
	 var voting_power = account.voting_power;
	 var last_vote_time = new Date((account.last_vote_time) + 'Z');
	 var elapsed_seconds = (new Date() - last_vote_time) / 1000;
	 var regenerated_power = Math.round((STEEMIT_100_PERCENT * elapsed_seconds) / STEEMIT_VOTE_REGENERATION_SECONDS);
	 var current_power = Math.min(voting_power + regenerated_power, STEEMIT_100_PERCENT);
	 return current_power;
}

function getVoteRShares(voteWeight, account, power) {
	 if (!account) {
			 return;
	 }

	 if (rewardBalance && recentClaims && steemPrice && votePowerReserveRate) {

			 var effective_vesting_shares = Math.round(getVestingShares(account) * 1000000);
			 var voting_power = account.voting_power;
			 var weight = voteWeight * 100;
			 var last_vote_time = new Date((account.last_vote_time) + 'Z');


			 var elapsed_seconds = (new Date() - last_vote_time) / 1000;
			 var regenerated_power = Math.round((STEEMIT_100_PERCENT * elapsed_seconds) / STEEMIT_VOTE_REGENERATION_SECONDS);
			 var current_power = power || Math.min(voting_power + regenerated_power, STEEMIT_100_PERCENT);
			 var max_vote_denom = votePowerReserveRate * STEEMIT_VOTE_REGENERATION_SECONDS / (60 * 60 * 24);
			 var used_power = Math.round((current_power * weight) / STEEMIT_100_PERCENT);
			 used_power = Math.round((used_power + max_vote_denom - 1) / max_vote_denom);

			 var rshares = Math.round((effective_vesting_shares * used_power) / (STEEMIT_100_PERCENT))

			 return rshares;

	 }
}

function getVoteValue(voteWeight, account, power) {
	 if (!account) {
			 return;
	 }
	 if (rewardBalance && recentClaims && steemPrice && votePowerReserveRate) {
			 var voteValue = getVoteRShares(voteWeight, account, power)
				 * rewardBalance / recentClaims
				 * steemPrice;

			 return voteValue;

	 }
}

function timeTilFullPower(account){
	 var cur_power = getVotingPower(account);
	 return (STEEMIT_100_PERCENT - cur_power) * STEEMIT_VOTE_REGENERATION_SECONDS / STEEMIT_100_PERCENT;
}

function getVestingShares(account) {
	 var effective_vesting_shares = parseFloat(account.vesting_shares.replace(" VESTS", ""))
		 + parseFloat(account.received_vesting_shares.replace(" VESTS", ""))
		 - parseFloat(account.delegated_vesting_shares.replace(" VESTS", ""));
	 return effective_vesting_shares;
}

function popupCenter(url, title, w, h) {
	// Fixes dual-screen position                         Most browsers      Firefox
	var dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
	var dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;

	var width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
	var height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

	var left = ((width / 2) - (w / 2)) + dualScreenLeft;
	var top = ((height / 2) - (h / 2)) + dualScreenTop;
	var newWindow = window.open(url, title, 'scrollbars=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);

	// Puts focus on the newWindow
	if (window.focus) {
			newWindow.focus();
	}

	return newWindow;
}