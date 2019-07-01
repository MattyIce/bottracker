$(function () {
	var RETURN = 1;
	var AUTHOR_REWARDS = 0.75;
	var MIN_VOTE = 5;
	var CURRENCY = 'USD';
	var bots = [];
	var other_bots = [];
	var FULL_CURATION_TIME = 30 * 60 * 1000;
	var api_url = 'https://steembottracker.net';
	var _filter = {};
	var user = null;
	var _dialog = null;
	var notifications = {};
	var favorites = [];
	var hidden = [];
	var notifications_enabled = true;

	startup();

	function startup() {
		loadPrices(loadBidBots);
		setInterval(loadPrices, 30 * 1000);

		loadOtherBots();
		setInterval(loadOtherBots, 10 * 60 * 1000);

		updateSteemVariables(loadPromotionServices);
    setInterval(loadPromotionServices, 10 * 60 * 1000);
    
    setInterval(loadBidBots, 30 * 1000);

		setInterval(updateTimers, 1000);

		startupDom();
	}

	function sendNotification(bot, bid) {
		if(!notifications_enabled)
			return;
		
		try {
			if (Notification.permission !== "granted")
				Notification.requestPermission();
			else {
				var notification = new Notification('Profitable Bidding Opportunity!', {
					icon: 'https://steembottracker.com/img/bot_logo.png',
					body: "@" + bot + ' is currently showing a profitable bidding opportunity! Max profitable bid is $' + bid.formatMoney() + ' SBD.'
				});
			}
		} catch (err) { }
	}

	function loadPrices(callback) {
    var loaded = 0;
    /*
		// Load the current prices of STEEM and SBD
		$.get('https://api.coinmarketcap.com/v1/ticker/steem/', function (data) {
			steem_price = parseFloat(data[0].price_usd);
			$('#steem_price').text(steem_price.formatMoney());
      $('#steem_price_container').css('color', (parseFloat(data[0].percent_change_24h) < 0) ? 'red' : 'green');
      
      if(++loaded == 2 && callback)
        callback();
		});

    // Load the current prices of STEEM and SBD
		$.get('https://api.coinmarketcap.com/v1/ticker/steem-dollars/', function (data) {
			sbd_price = parseFloat(data[0].price_usd);
			$('#sbd_price').text(sbd_price.formatMoney());
      $('#sbd_price_container').css('color', (parseFloat(data[0].percent_change_24h) < 0) ? 'red' : 'green');
      
      if(++loaded == 2 && callback)
        callback();
    });*/

    $.get('https://postpromoter.net/api/prices', function (data) {
      steem_price = parseFloat(data.steem_price);
			sbd_price = parseFloat(data.sbd_price);
			token_prices = data.se_token_prices;

      $('#steem_price').text(steem_price.formatMoney());
      $('#sbd_price').text(sbd_price.formatMoney());

      if(callback)
        callback();
    })
  }

	function loadOtherBots() {
      $.get(api_url + '/other_bots', function (data) {
				data.sort(function (a, b) { return b.vote_value - a.vote_value; });

				var container = $('#other_table tbody');
				container.empty();

				for(var i = 0; i < data.length; i++) {
					var bot = data[i];

					var row = $(document.createElement('tr'));
					var td = $('<td><a target="_blank" href="https://steemit.com/@' + bot.name + '">@' + bot.name + '</a></td>');
					row.append(td);

					td = $('<td>$' + bot.vote_value.toFixed(2) + '</td>');
					row.append(td);

					td = $('<td>' + (bot.profile.about ? bot.profile.about : '') + '</td>');
					row.append(td);

					td = $('<td>' + (bot.profile.website ? '<a target="_blank" href="' + bot.profile.website + '">' + bot.profile.website + '</a>' : '') + '</td>');
					row.append(td);
					container.append(row);
				}
			});
    }

	function loadBidBots() {
		$.get(api_url + '/bid_bots', function (data) {
			bots = data.filter(d => d.vote_usd > 0.1 && d.last < 10 * 60 * 60 * 1000);
			
			// Populate the drop down list of bots for the vote value calculator
			bots.map(function(b) { return b.name }).sort().forEach(function(name) {
				$('#bot_list').append('<option value="' + name + '">' + name + '</option>');
			});

			showBidBots();
		});
	}

	function loadPromotionServices() {
		steem.api.getAccounts(['smartsteem', 'booster', 'minnowbooster', 'tipu'], function (err, result) {
			try {
				var account = result[0];
				var bar = $('#smartsteem-progress div');
				var power = getVotingPower(account) / 100;
				bar.attr('aria-valuenow', power);
				bar.css('width', power + '%');
				bar.text(power + '%');
				$('#smartsteem-vote').text('$' + getVoteValue(100, account).formatMoney());
				$('#ss_bot_error').css('display', 'none');

				account = result[1];
				var metadata = JSON.parse(account.json_metadata);
				//$('#booster-desc').text(metadata.profile.about);

				var bar = $('#booster-progress div');
				var power = getVotingPower(account) / 100;
				bar.attr('aria-valuenow', power);
				bar.css('width', power + '%');
				bar.text(power + '%');
				$('#booster-vote').text('$' + getVoteValue(100, account).formatMoney());
				$('#booster_bot_error').css('display', 'none');

				account = result[2];
				var bar = $('#minnowbooster-progress div');
				var power = getVotingPower(account) / 100;
				bar.attr('aria-valuenow', power);
				bar.css('width', power + '%');
				bar.text(power + '%');
				$('#minnowbooster-vote').text('$' + getVoteValue(100, account).formatMoney());
				$('#mb_bot_error').css('display', 'none');

				account = result[3];
				var metadata = JSON.parse(account.json_metadata);
				$('#tipu-desc').text(metadata.profile.about);

				var bar = $('#tipu-progress div');
				var power = getVotingPower(account) / 100;
				bar.attr('aria-valuenow', power);
				bar.css('width', power + '%');
				bar.text(power + '%');
				$('#tipu-vote').text('$' + getVoteValue(100, account).formatMoney());
				$('#tipu_bot_error').css('display', 'none');
			} catch (err) {
				console.log(err);
				$('#ss_bot_error').css('display', 'block');
			}
		});

		$.get('https://smartsteem.com/api/general/bot_tracker', function (data) {
			$('#smartsteem-desc').text(data.description);
			$('#smartsteem-profit').text(data.profit);
			$('#smartsteem-payment').text(data.payment);
			$('#smartsteem-daily').text(data.daily_limit);
			$('#smartsteem-weekly').text(data.weekly_limit);
			$('#smartsteem-features').text(data.additional_features);
			$('#smartsteem-howto').empty();

			data.how_to.forEach(function (item) {
				$('#smartsteem-howto').append($('<li>' + item + '</li>'));
			});
		});
	}

	function showBidBots() {
		$('#bots_table tbody').empty();

		var favorite_bots = bots.filter(function(b) { return favorites.indexOf(b.name) >= 0; });
		var others = bots.filter(function(b) { return favorites.indexOf(b.name) < 0; });

		// Order the bots by their next vote time
		favorite_bots.sort(function(a, b) {
			var an = (a.power == 100 && a.last > 3 * HOURS || a.last < 60 * 1000) ? 9990000000 : a.next;
			var bn = (b.power == 100 && b.last > 3 * HOURS || b.last < 60 * 1000) ? 9990000000 : b.next;
			return an - bn;
		});

		others.sort(function(a, b) {
			var an = (a.power == 100 && a.last > 3 * HOURS || a.last < 60 * 1000) ? 9990000000 : a.next;
			var bn = (b.power == 100 && b.last > 3 * HOURS || b.last < 60 * 1000) ? 9990000000 : b.next;
			return an - bn;
		});

		if(favorite_bots.length > 0) {
			favorite_bots.forEach(showBot);
			var row = $(document.createElement('tr'));
			var td = $(document.createElement('td'));
			td.attr('colspan', '10');
			td.html('<hr style="margin: 0;"/>');
			row.append(td);
			$('#bots_table tbody').append(row);
		}

		others.forEach(showBot);

		$('[data-toggle="tooltip"]').tooltip();

		if(hidden.length > 0) {
			$('#bots_hidden').text(hidden.length);
			$('#unhide_link').show();
		}
	}

	function showBot(bot) {
		var isFavorite = favorites.indexOf(bot.name) >= 0;

		// Don't show bots that are filtered out
		if (!isFavorite && (hidden.indexOf(bot.name) >= 0 || bot.vote_usd < MIN_VOTE || (_filter.verified && !bot.api_url) || (_filter.refund && !bot.refunds) || (_filter.steem && !bot.accepts_steem) || (_filter.se && !bot.se_token) || (_filter.nocomment && (bot.posts_comment == undefined || bot.posts_comment))))
		  return;

		let max_suggested_bid = (AUTHOR_REWARDS * bot.vote_usd - RETURN * bot.total_usd);
		var bid_sbd = (AUTHOR_REWARDS * bot.vote_usd - RETURN * bot.total_usd) / sbd_price;
		var bid_steem = bot.accepts_steem ? (AUTHOR_REWARDS * bot.vote_usd - RETURN * bot.total_usd) / steem_price : 0;

		if(bot.se_token && token_prices[bot.se_token])
			max_suggested_bid = max_suggested_bid / (token_prices[bot.se_token] * steem_price);

		var row = $(document.createElement('tr'));

		var td = $(document.createElement('td'));
		var link = $(document.createElement('a'));
		link.attr('href', 'http://www.steemit.com/@' + bot.name);
		link.attr('target', '_blank');
		var text = '@' + bot.name;

		if(bot.power == 100 && bot.last > 4 * HOURS || bot.power < 90)
		  text += ' (DOWN)';

		link.html("<img class='userpic' src='https://steemitimages.com/u/" + bot.name + "/avatar'></img>" + text);
		td.append(link);

		if(bot.comments) {
			var icon = $('<span class="fa fa-comment-o ml5" aria-hidden="true" data-toggle="tooltip" data-placement="top" title="Allows Comments"></span>');
			td.append(icon);
		}

		if (bot.posts_comment != undefined && !bot.posts_comment) {
		  var icon = $('<img src="img/no_comment.png" style="width: 20px; margin-left: 5px;" data-toggle="tooltip" data-placement="top" title="This bot does not post a comment when it votes on a post." />');
		  td.append(icon);
		}

		if(bot.accepts_steem) {
		  var icon = $('<img src="img/steem.png" style="width: 20px; margin-left: 5px;" data-toggle="tooltip" data-placement="top" title="This bot accepts STEEM bids!" />');
		  td.append(icon);
		}

		if (bot.se_token) {
		  var icon = $('<img src="img/steem_engine_logo_32.png" style="width: 20px; margin-left: 5px;" data-toggle="tooltip" data-placement="top" title="This bot only accepts the ' + bot.se_token + ' Steem Engine token." />');
		  td.append(icon);
		}

		if(bot.refunds) {
			var icon = $('<img src="img/refund.png" style="width: 20px; margin-left: 5px;" data-toggle="tooltip" data-placement="top" title="This bot automatically refunds invalid bids!" />');
			td.append(icon);
		}

		row.append(td);

		td = $(document.createElement('td'));
		td.text(formatCurrencyVote(bot));
		row.append(td);

		td = $(document.createElement('td'));
		var span = $('<span>');
		if(bot.max_bid && bot.max_bid_wl && parseFloat(bot.max_bid_wl) > parseFloat(bot.max_bid)) {
      span.attr('data-toggle', 'tooltip');
      span.attr('data-placement', 'top');
      span.attr('title', 'This bot has a higher max bid for whitelisted accounts.');
		}

		span.html(bot.min_bid.toFixed(2) + (bot.max_bid ? ' / ' + bot.max_bid.toFixed(2) : '') + (bot.max_bid_wl ? '*' : ''));
		td.append(span);
		row.append(td);

		td = $(document.createElement('td'));
		td.text((bot.fill_limit ? ((1 - bot.fill_limit) * 100).toFixed() + '%' : 'none') + ' / ' + (bot.max_roi ? bot.max_roi + '%' : 'none'));
		row.append(td);

		td = $(document.createElement('td'));
		td.text((bot.min_post_age ? bot.min_post_age : 0) + ' mins / ' + (bot.max_post_age ? bot.max_post_age + ' days' : 'unknown'));
		row.append(td);

		td = $(document.createElement('td'));
		td.text(!isNaN(bot.total_usd) ? formatCurrencyTotal(bot) : '--');
		row.append(td);

		td = $(document.createElement('td'));
		if(isNaN(bot.total_usd)) {
			td.text('unknown');
		} else if(bot.se_token)
			td.text(Math.max(max_suggested_bid, 0).formatMoney() + ' ' + bot.se_token); 
		else if (bot.accepts_steem)
		  td.html(Math.max(bid_steem, 0).formatMoney() + ' <img src="img/steem.png" style="width: 17px; vertical-align: top;"/> or ' + Math.max(bid_sbd, 0).formatMoney() + ' SBD');
		else
		  td.text(Math.max(bid_sbd, 0).formatMoney() + ' SBD');

		row.append(td);

		td = $(document.createElement('td'));
		td.addClass('timer');
		td.attr('dir', 'up');
		td.attr('time', bot.last);
		td.text(toTimer(bot.last));
		row.append(td);

		td = $(document.createElement('td'));
		td.addClass('timer');
		td.attr('time', bot.next);
		td.text(toTimer(bot.next));
		row.append(td);

		td = $(document.createElement('td'));

		var dropdown_container = $('<div class="dropdown"><button class="btn btn-xs btn-warning dropdown-toggle" type="button" id="dropdownMenu1" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">Actions&nbsp;<span class="caret"></span></button></div>')
		var dropdown = $('<ul class="actions dropdown-menu dropdown-menu-right" aria-labelledby="dLabel"></ul>');

		if(!isNaN(bot.total_usd)) {
			var link = $('<li><a href="javascript:void(0);"><i class="fa fa-eye mr5"></i>Details</a></li>');
			link.click(function (e) { showBotDetails(bot); });
			dropdown.append(link);
		}

		var link = $('<li><a href="javascript:void(0);"><i class="fa fa-upload mr5"></i>Send Bid</a></li>');
		link.click(function (e) { sendBid(bot); });
		dropdown.append(link);

		if(isFavorite) {
			var link = $('<li><a href="javascript:void(0);"><i class="fa fa-heart mr5" style="color: red;"></i>Un-Favorite</a></li>');
			link.click(function (e) {
				favorites.splice(favorites.indexOf(bot.name), 1);
				localStorage.setItem('favorites', favorites.join());
				showBidBots();
			});
			dropdown.append(link);
		} else {
			var link = $('<li><a href="javascript:void(0);"><i class="fa fa-heart mr5" style="color: red;"></i>Favorite</a></li>');
			link.click(function (e) {
				favorites.push(bot.name);
				localStorage.setItem('favorites', favorites.join());
				showBidBots();
			});
			dropdown.append(link);
		}

		if(hidden.indexOf(bot.name) >= 0) {
			var link = $('<li><a href="javascript:void(0);"><i class="fa fa-remove mr5"></i>Un-Hide</a></li>');
			link.click(function (e) {
				hidden.splice(hidden.indexOf(bot.name), 1);
				localStorage.setItem('hidden', hidden.join());
				showBidBots();
			});
			dropdown.append(link);
		} else {
			var link = $('<li><a href="javascript:void(0);"><i class="fa fa-remove mr5"></i>Hide</a></li>');
			link.click(function (e) {
				hidden.push(bot.name);
				localStorage.setItem('hidden', hidden.join());
				showBidBots();
			});
			dropdown.append(link);
		}

		if(bot.rules_url && bot.rules_url != '') {
			var link = $('<li><a href="' + bot.rules_url + '" target="_blank"><i class="fa fa-list-alt mr5"></i>Terms of Service</a></li>');
			dropdown.append(link);
		}

		dropdown_container.append(dropdown);
		td.append(dropdown_container);
		row.append(td);

		if ((bid_sbd > 0 || bid_steem > 0) && bot.next < 0.16 * HOURS && bot.last > 0.5 * HOURS) {
			row.addClass('green-bg');

			if (!notifications[bot.name]) {
				sendNotification(bot.name, bid_sbd);
				notifications[bot.name] = true;
			}
		} else
			notifications[bot.name] = false;

		if(bot.power == 100 && bot.last > 4 * HOURS || bot.power < 90)
		  row.addClass('red-light-bg');

		$('#bots_table tbody').append(row);
	}

	function formatCurrencyVote(bot) {
		switch (CURRENCY) {
			case 'SBD':
				return (bot.vote_usd / sbd_price).formatMoney() + ' SBD';
				break;
			case 'STEEM':
				return (bot.vote_usd / steem_price).formatMoney() + ' STEEM';
				break;
			case 'USD':
				return '$' + bot.vote_usd.formatMoney();
				break;
			case 'POST REWARDS':
				return '$' + bot.vote.formatMoney();
				break;
		}
	}

	function formatCurrencyTotal(bot) {
		switch (CURRENCY) {
			case 'SBD':
				return (bot.total_usd / sbd_price).formatMoney() + ' SBD';
				break;
			case 'STEEM':
				return (bot.total_usd / steem_price).formatMoney() + ' STEEM';
				break;
			case 'USD':
				return '$' + bot.total_usd.formatMoney();
				break;
			case 'POST REWARDS':
				return '$' + ((bot.total_usd / bot.vote_usd) * bot.vote).formatMoney();
				break;
		}
	}

	function sumBids(round, currency) {
		return round.reduce(function(total, bid) { return total + ((bid.currency == currency) ? parseFloat(bid.amount) : 0); }, 0);
	}

	function showBotDetails(bot) {
		$('#bid_details_bot').text(bot.name);
		$('#bid_details_table_cur tbody').empty();
		$('#bid_details_table_last tbody').empty();

		$('#cur_round_vote').text('Loading...');
		$('#cur_round_bids').text('Loading...');
		$('#cur_round_value').text('Loading...');
		$('#cur_round_roi').text('Loading...');

		$('#last_round_vote').text('Loading...');
		$('#last_round_bids').text('Loading...');
		$('#last_round_value').text('Loading...');
		$('#last_round_roi').text('Loading...');

		$.get(api_url + '/bid_bots/' + bot.name, function(data) {
			var cur_table = $('#bid_details_table_cur tbody');
			cur_table.empty();
			var last_table = $('#bid_details_table_last tbody');
			last_table.empty();

			if (data && data.current_round) {
				data.current_round.round_total = data.current_round.reduce(function(t, b) { return t + getUsdValue(b); }, 0);
				populateRoundDetailTable(cur_table, bot, data.current_round);

				$('#cur_round_vote').text(formatCurrencyVote(bot) + ' (' + (bot.interval / 2.4 * 100) + '%)');

				if(bot.se_token)
					$('#cur_round_bids').text(sumBids(data.current_round, bot.se_token).formatMoney() + ' ' + bot.se_token);
				else
					$('#cur_round_bids').text(sumBids(data.current_round, 'SBD').formatMoney() + ' SBD' + (bot.accepts_steem ? ' & ' + sumBids(data.current_round, 'STEEM').formatMoney() + ' STEEM' : ''));

				$('#cur_round_value').text('$' + bot.total_usd.formatMoney());

				var roi = (((bot.vote_usd * AUTHOR_REWARDS / data.current_round.round_total) - 1) * 100);
				if(bot.max_roi)
					roi = Math.min(bot.max_roi, roi);

				$('#cur_round_roi').text(roi.formatMoney() + '% (After Curation' + (bot.max_roi ? ' - Capped)' : ')'));
			}

			if (data && data.last_round) {
				data.last_round.round_total = data.last_round.reduce(function(t, b) { return t + getUsdValue(b); }, 0);
				populateRoundDetailTable(last_table, bot, data.last_round);

				$('#last_round_vote').text(formatCurrencyVote(bot) + ' (' + (bot.interval / 2.4 * 100) + '%)');

				if(bot.se_token)
					$('#last_round_bids').text(sumBids(data.last_round, bot.se_token).formatMoney() + ' ' + bot.se_token);
				else
				$('#last_round_bids').text(sumBids(data.last_round, 'SBD').formatMoney() + ' SBD' + (bot.accepts_steem ? ' & ' + sumBids(data.last_round, 'STEEM').formatMoney() + ' STEEM' : ''));

				$('#last_round_value').text('$' + data.last_round.round_total.formatMoney());

				var roi = (((bot.vote_usd * AUTHOR_REWARDS / data.last_round.round_total) - 1) * 100);
				if(bot.max_roi)
					roi = Math.min(bot.max_roi, roi);

				$('#last_round_roi').text(roi.formatMoney() + '% (After Curation' + (bot.max_roi ? ' - Capped)' : ')'));
			}

			$('#cur_round_show').click(function (e) {
					$('#cur_round').show();
					$('#cur_round_show').parent().addClass('active');
					$('#last_round').hide();
					$('#last_round_show').parent().removeClass('active');
			});

			$('#last_round_show').click(function (e) {
					$('#cur_round').hide();
					$('#cur_round_show').parent().removeClass('active');
					$('#last_round').show();
					$('#last_round_show').parent().addClass('active');
			});
		});

		$('#bid_details').modal();
	}

	function populateRoundDetailTable(table, bot, round) {
		round.forEach(function (bid) {
			var amount = parseFloat(bid.amount);
			var bid_value = getUsdValue(bid);
			var currency = bid.currency;
			var row = $(document.createElement('tr'));

			var td = $(document.createElement('td'));
			var link = $(document.createElement('a'));
			link.attr('href', 'http://www.steemit.com/@' + bid.sender);
			link.attr('target', '_blank');
			link.text('@' + bid.sender);

			td.append(link);
			row.append(td);

			var td = $(document.createElement('td'));
			td.text(amount.formatMoney() + ' ' + currency);
			td.css('text-align', 'right');
			row.append(td);

			var td = $(document.createElement('td'));
			td.text('$' + bid_value.formatMoney());
			td.css('text-align', 'right');
			row.append(td);

			var td = $(document.createElement('td'));
			
			var vote_percent = 0;
			if(bid.weight)
				vote_percent = (bid.weight / 100);
			else if(bot.max_roi) {
				var min_total_bids_value_usd = bot.vote_usd * AUTHOR_REWARDS * ((100 - bot.max_roi) / 100 );
				var adjusted_weight = (bot.total_usd < min_total_bids_value_usd) ? (bot.total_usd / min_total_bids_value_usd) : 1;
				vote_percent = (bid_value / round.round_total * 100) * adjusted_weight;
			} else
				vote_percent = (bid_value / round.round_total * 100);
			
			td.text(vote_percent.formatMoney() + '%');
			td.css('text-align', 'right');
			row.append(td);

			var value = ((bid.weight ? (bid.weight / 10000) : (vote_percent / 100)) * parseFloat(formatCurrencyVote(bot).replace(/[$,]/g, ''))).formatMoney();

			if(CURRENCY == 'SBD' || CURRENCY == 'STEEM')
				value = value + ' ' + CURRENCY;
			else
				value = '$' + value;

			var td = $(document.createElement('td'));
			td.text(value);
			td.css('text-align', 'right');
			row.append(td);

			var td = $(document.createElement('td'));
			var div = $(document.createElement('div'));
			div.css('width', '250px');
			div.css('overflow', 'hidden');
			div.css('height', '23px');

			var link = $(document.createElement('a'));
			link.attr('href', (bid.url.startsWith('http') ? bid.url : ('https://steemit.com' + bid.url)));
			link.attr('target', '_blank');
			link.text(bid.url);
			div.append(link);
			td.append(div);
			row.append(td);

			table.append(row);
		});
	}

	function sendBid(bot) {
		$('#bid_details_dialog_bot_name').text(bot.name);
		$('#bid_details_error').hide();
		$('#bid_details_btn_submit').off('click');
		$('#bid_details_btn_submit').click(submitBid);
		$('#bid_details_post_url').val('');
		$('#bid_details_bid_amount').val(bot.min_bid)
		$('#bid_details_bid_amount').attr("min", bot.min_bid);
		_dialog = $('#bid_details_dialog').modal();
		_dialog.off('hidden.bs.modal');
		_dialog.bot = bot;

		$('#bid_details_bid_currency').empty();
		if(bot.se_token)
			$('#bid_details_bid_currency').append('<option value="' + bot.se_token + '">' + bot.se_token + '</option>');
		else {
			$('#bid_details_bid_currency').append('<option value="SBD">SBD</option>');
			$('#bid_details_bid_currency').append('<option value="STEEM">STEEM</option>');
		}

		var account_name = user ? user.name : localStorage.getItem('bid_details_account_name');
		if (account_name) {
			$('#bid_details_account_name').val(account_name);
			loadRecentPosts();
		}
	}

	function submitBid() {
		var to = _dialog.bot.payment_acct ? _dialog.bot.payment_acct : $('#bid_details_dialog_bot_name').text();
		var from = $('#bid_details_account_name').val();
		var amount = $('#bid_details_bid_amount').val();
		var currency = $('#bid_details_bid_currency').val();
		var url = $('#bid_details_post_url').val();

		checkPost(_dialog.bot, url, amount, currency, function (error) {
			if (error) {
				$('#bid_details_error').html('<b>Error:</b> ' + error);
				$('#bid_details_error').show();
			} else {
				console.log(1);
				submitBidPayment(to, from, amount, currency, url);
				_dialog.modal('hide');
			}
		});		
	}

	function submitBidPayment(to, from, amount, currency, url) {
		if(['SBD', 'STEEM'].includes(currency)) {
			if(window.steem_keychain)
				steem_keychain.requestTransfer(from, to, parseFloat(amount).toFixed(3), url, currency, r => console.log(r));
			else
				popupCenter('https://v2.steemconnect.com/sign/transfer?from=' + from + '&to=' + to + '&amount=' + amount + ' ' + currency + '&memo=' + url, 'sc2-pay', 500, 560);
		} else {
			var transaction_data = {
				"contractName": "tokens",
				"contractAction": "transfer",
				"contractPayload": {
					"symbol": currency,
					"to": to,
					"quantity": amount + '',
					"memo": url
				}
			};

			if(window.steem_keychain)
				steem_keychain.requestCustomJson(from, 'ssc-mainnet1', 'Active', JSON.stringify(transaction_data), 'Token Transfer: ' + currency);
			else {
				var sc_url = 'https://steemconnect.com/sign/custom-json?required_posting_auths=' + encodeURI('[]') + '&required_auths=' + encodeURI('["' + from + '"]&id=ssc-mainnet1&json=' + JSON.stringify(transaction_data));
				popupCenter(sc_url, 'sc2-pay', 500, 560);
			}

		}
	}

	function checkPost(bot, memo, amount, currency, callback) {
		if (currency == 'STEEM' && !bot.accepts_steem) {
			callback('This bot does not accept STEEM bids!');
			return;
		}
		else if (currency == 'STEEM' && parseFloat(amount) < bot.min_bid_steem) {
			callback('Bid is below the minimum, please bid ' + bot.min_bid_steem + ' STEEM or more!');
			return;
		}
		else if (currency == 'SBD' && parseFloat(amount) < bot.min_bid) {
			callback('Bid is below the minimum, please bid ' + bot.min_bid + ' SBD or more!');
			return;
		}

		var permLink = memo.substr(memo.lastIndexOf('/') + 1);
		var author = memo.substring(memo.lastIndexOf('@') + 1, memo.lastIndexOf('/'));

		steem.api.getContent(author, permLink, function (err, result) {
			if (!err && result && result.id > 0) {
				var created = new Date(result.created + 'Z');

				var votes = result.active_votes.filter(function (vote) { return vote.voter == bot.name; });
				var already_voted = votes.length > 0 && (new Date() - new Date(votes[0].time + 'Z') > 20 * 60 * 1000);

				if (already_voted) {
					// This post is already voted on by this bot
					callback("This bot has already voted on this post!");
				} else if ((new Date() - created) >= (bot.max_post_age * 24 * 60 * 60 * 1000)) {
					// This post is too old
					callback("This post is past the max age accepted by this bot!");
				} else
					callback(null); // Post is ok!
			} else
				callback("There was an error loading this post, please check the URL.");
		});
	}

	function loadRecentPosts() {
		var author =  $('#bid_details_account_name').val();
		var holder = $("#bid_details_recent_posts");
		var cutoff = new Date().getTime() - ((_dialog.bot.max_post_age ? _dialog.bot.max_post_age : 6) * 24 * 60 * 60 * 1000);

		steem.api.getDiscussionsByAuthorBeforeDate(author, null, new Date().toISOString().split('.')[0], 5, function (err, result) {
			var posts = result.filter(function(p) { return new Date(p.created).getTime() > cutoff });

			if (posts.length > 0) {
				holder.empty()
			} else {
				holder.html('None Found');
			}

			posts.forEach(function(post) {
				var linktext = post.title.length > 25 ? post.title.substring(0,22) + '...' : post.title;
				var button = $('<button type="button" class="btn btn-info btn-xs" style="margin: 0 5px;">' + linktext + '</button>');
				holder.append(button);
				button.click(function() {
					$("#bid_details_post_url").val('https://steemit.com' + post.url);
				})
			})
		});
	}

	function startupDom() {
    $('#curation_option').on('change', function () {
        if(this.checked) {
            AUTHOR_REWARDS = 0.75;
        } else {
            AUTHOR_REWARDS = 1;
        }
        showBidBots();
    });
		
		$('#notification_option').on('change', function () {
        notifications_enabled = this.checked;
				localStorage.setItem('notifications_enabled', this.checked);
    });
		
		if (localStorage.hasOwnProperty('notifications_enabled')) {
			notifications_enabled = localStorage.getItem('notifications_enabled') == 'true';
			$('#notification_option').attr('checked', notifications_enabled);
		}

		if (localStorage.hasOwnProperty('favorites'))
			favorites = localStorage.getItem('favorites').split(',');

		if (localStorage.hasOwnProperty('hidden'))
			hidden = localStorage.getItem('hidden').split(',').filter(function(b) { return b != ''; });

		$('#unhide_link a').click(function() {
			hidden = [];
			localStorage.setItem('hidden', '');
			showBidBots();
			$('#unhide_link').hide();
		});

    //remember currency choice
    if (!localStorage.hasOwnProperty('currency_list')) {
      localStorage.setItem('currency_list', 'USD');
    } else {
      $('#currency_list').val(localStorage.getItem('currency_list'));
      CURRENCY = localStorage.getItem('currency_list');
    }

    $('#currency_list').change(function () {
      CURRENCY = $('#currency_list').val();
      localStorage.setItem('currency_list', CURRENCY);
      showBidBots();
    });

    $('#min_vote_slider').slider();

    $('#bid_details_account_name').on("change", function(e) {
      localStorage.setItem('bid_details_account_name', $('#bid_details_account_name').val());
      loadRecentPosts();
    });

    //remember slider choice
    if (!localStorage.hasOwnProperty('min_vote_slider')) {
      localStorage.setItem('min_vote_slider', MIN_VOTE);
    } else {
      $('#min_vote_slider').slider('setValue', localStorage.getItem('min_vote_slider'));
      MIN_VOTE = parseFloat(localStorage.getItem('min_vote_slider'));
    }

    $('#min_vote_slider').on("slide", function(e) {
      if(e.value != MIN_VOTE) {
        MIN_VOTE = parseFloat(e.value);
        localStorage.setItem('min_vote_slider', e.value);
        showBidBots();
      }
    });

    $('#calculate_vote').click(function() {
      var bot = null;
      var name = $('#bot_list').val();

      bots.forEach(function(b) {
        if(b.name == name)
          {
            bot = b;
            return;
          }
      });

      var currency = $('#calc_currency').val();
      var bid = parseFloat($('#bid_amount').val());
			var bid_value = (currency == 'SBD') ? bid * sbd_price : bid * steem_price;

      var value = bid_value / (bid_value + bot.total_usd) * bot.vote_usd;
      var value_sbd = (bid_value / (bid_value + bot.total_usd) * bot.vote) / 2;
      var value_steem = ((bid_value / (bid_value + bot.total_usd) * bot.vote) / 2 / steem_price);

      $('#bid_value').text('$' + bid_value.formatMoney());
      $('#vote_value').text('$' + value.formatMoney() + ' = ' + value_sbd.formatMoney() + ' SBD + ' + value_steem.formatMoney() + ' STEEM');
      $('#vote_value_net').text('$' + (value * 0.75).formatMoney() + ' = ' + (value_sbd * 0.75).formatMoney() + ' SBD + ' + (value_steem * 0.75).formatMoney() + ' STEEM');

      $('#vote_value').css('color', (value >= bid_value) ? '#008800' : '#FF0000');
      $('#vote_value_net').css('color', ((value * 0.75) >= bid_value) ? '#008800' : '#FF0000');

      return false;
    });

		$('#close_peg_msg').click(function() {
			$('#peg_msg').hide();
			localStorage.setItem('hide_peg_msg', true);
		});

		if (localStorage.hasOwnProperty('hide_peg_msg'))
			$('#peg_msg').hide();

		if (!localStorage.hasOwnProperty('accept_disclaimer')) {
	    // Show disclaimer message
	    setTimeout(function () {
				$('#disclaimer').modal();
				localStorage.setItem('accept_disclaimer', true);
			}, 2000);
		}

    $('#filter_verified').click(function () { toggleFilter('verified'); });
    $('#filter_refund').click(function () { toggleFilter('refund'); });
    $('#filter_steem').click(function () { toggleFilter('steem'); });
    $('#filter_se').click(function () { toggleFilter('se'); });
    $('#filter_nocomment').click(function () { toggleFilter('nocomment'); });

    function toggleFilter(filter) {
      _filter[filter] = !_filter[filter];
      $('#filter_' + filter).css('border', _filter[filter] ? '2px solid green' : 'none');
      showBidBots();
    }

    $('#minnowbooster-submit').click(function () { sendBid({ name: 'minnowbooster', min_bid: 0.01, max_post_age: 6.3 }); });
    $('#booster-submit').click(function () { sendBid({ name: 'booster', min_bid: 1, max_post_age: 3.5 }); });
		$('#smartsteem-submit').click(function () { sendBid({ name: 'smartmarket', min_bid: 0.1, max_post_age: 6.3 }); });
		$('#tipu-submit').click(function () { sendBid({ name: 'tipu', min_bid: 0.5, max_post_age: 6, accepts_steem: true }); });

    // Initialize and try to log in with SteemConnect V2
    var token = getURLParameter('access_token') ? getURLParameter('access_token') : localStorage.getItem('access_token');
    sc2.init({
      baseURL: 'https://v2.steemconnect.com',
      app: 'bottracker.app',
      accessToken: token,
      callbackURL: 'https://steembottracker.com',
      scope: ['login', 'vote']
    });

    sc2.me(function (err, result) {
      if (result && !err) {
        console.log(result);
        user = result.account;
        $('#btn_login').hide();
        $('#user_info').show();
        $('#login_info').text('@' + user.name);
        localStorage.setItem('access_token', token);
      } else {
        $('#btn_login').show();
        $('#user_info').hide();
      }
    });

    $('#btn_logout').click(function () {
      localStorage.removeItem('access_token');
      window.location.href = window.location.pathname;
    });

    $('#btn_bid_history').click(function () {
      $('#user_bids').modal();
      loadUserBids();
    });

		$('#btn_front_run').click(function() {
			loadFrontRunnerPosts();
			$('#front_runner_dialog').modal();
		});
	}

	function loadUserBids() {
		steem.api.getAccountHistory(user.name, -1, 1000, function (err, result) {
			var bids = [];
			var num_loaded = 0;

			for (var i = 0; i < result.length; i++) {
				var trans = result[i];
				var op = trans[1].op;
				var bid = op[1];

				if (op[0] == 'transfer' && bots.find(function(b) { return b.name == bid.to; })) {
					// Check that the memo is a valid post or comment URL.
					if (bid.memo.lastIndexOf('/') < 0 || bid.memo.lastIndexOf('@') < 0)
						continue;

					bids.push(bid);
					loadUserContent(bid, function () {
						num_loaded++;

						if (num_loaded >= bids.length) {
							console.log(bids);
							populateUserBids(bids);
						}
					});
				} else if (op[0] == 'transfer' && bots.find(function(b) { return b.name == bid.from; })) {
					// This means the bid was refunded
					var bid = bids.find(function (b) { return b.to == op[1].from && b.amount == op[1].amount; });

					if (bid)
						bid.refunded = true;
				}
			}
		});
	}

	function loadUserContent(bid, callback) {
		var permLink = bid.memo.substr(bid.memo.lastIndexOf('/') + 1);
		var author = bid.memo.substring(bid.memo.lastIndexOf('@') + 1, bid.memo.lastIndexOf('/'));

		steem.api.getContent(author, permLink, function (err, result) {

			if (!err && result && result.id > 0) {
				var vote = result.active_votes.find(function (v) { return v.voter == bid.to });

				if (vote) {
					bid.vote_rshares = vote.rshares;
					bid.vote_percent = vote.percent;
				}

				bid.title = result.title;
			} else
				console.log(err);

			if (callback)
				callback();
		});
	}

	function populateUserBids(bids) {
		var table = $('#user_bids_table tbody');
		table.empty();
		$('#user_bids_name').text(user.name);

		bids.reverse();

		bids.forEach(function (bid) {
			if (!bid.title)
				return;

			var amount = parseFloat(bid.amount);
			var bid_value = getUsdValue(bid);
			var currency = getCurrency(bid.amount);
			var row = $(document.createElement('tr'));

			var td = $(document.createElement('td'));
			var link = $(document.createElement('a'));
			link.attr('href', bid.memo);
			link.attr('target', '_blank');
			link.text(bid.title.length > 30 ? bid.title.substr(0, 30) + '...' : bid.title);
			td.append(link);
			row.append(td);

			var td = $(document.createElement('td'));
			var link = $(document.createElement('a'));
			link.attr('href', 'https://steemit.com/@' + bid.to);
			link.attr('target', '_blank');
			link.text('@' + bid.to);
			td.append(link);
			row.append(td);

			var td = $(document.createElement('td'));
			td.text(amount.formatMoney() + ' ' + currency + (bid.refunded ? ' (refunded)' : ''));
			td.css('text-align', 'right');
			row.append(td);

			var td = $(document.createElement('td'));
			td.text('$' + bid_value.formatMoney());
			td.css('text-align', 'right');
			row.append(td);

			var td = $(document.createElement('td'));
			td.text((bid.refunded || !bid.vote_rshares) ? '--' : (bid.vote_percent / 100).formatMoney() + '%');
			td.css('text-align', 'right');
			row.append(td);

			var vote_value = bid.vote_rshares * rewardBalance / recentClaims * steemPrice;
			var td = $(document.createElement('td'));
			td.text((bid.refunded || !bid.vote_rshares) ? '--' : '$' + vote_value.formatMoney());
			td.css('text-align', 'right');
			row.append(td);

			var td = $(document.createElement('td'));
			td.text((bid.refunded || !bid.vote_rshares) ? '--' : '$' + (vote_value / 2 * sbd_price + vote_value / 2).formatMoney());
			td.css('text-align', 'right');
			row.append(td);

			var td = $(document.createElement('td'));
			td.text((bid.refunded || !bid.vote_rshares) ? '--' : (((vote_value / 2 * sbd_price + vote_value / 2) / bid_value - 1) * 100).formatMoney() + '%');
			td.css('text-align', 'right');
			row.append(td);

			table.append(row);
		});
	}

	function loadFrontRunnerPosts() {
		$.get(api_url + '/posts', function(data) {
			var posts = data;

			var num_loaded = 0;
			posts.forEach(function (post) {
				var permLink = post.permlink;
				var author = post.author;

				steem.api.getContent(author, permLink, function (err, result) {
					if (!err && result && result.id > 0) {
						post.created = new Date(result.created + 'Z');
						post.payout = parseFloat(result.pending_payout_value);
						post.title = result.title;
						post.author = result.author;
						post.permlink = result.permlink;

						var pre_30_min_pct = Math.min(new Date() - new Date(result.created + 'Z'), FULL_CURATION_TIME) / FULL_CURATION_TIME;
						post.curation_reward = (Math.sqrt((post.payout + 1) * 0.25) - Math.sqrt(post.payout * 0.25)) * Math.sqrt((post.payout + 1 + post.vote_value) * 0.25) * pre_30_min_pct;

						if(user) {
							post.voted = (result.active_votes.find(function(v) { return v.voter == user.name; }) != null);
						}
					}

					num_loaded++;

					if(num_loaded >= posts.length) {
						posts.sort(function (a, b) { return parseFloat(b.curation_reward) - parseFloat(a.curation_reward) });
						populateFrontRunnerPosts(posts);
					}
				});
			});
		});
	}

	function populateFrontRunnerPosts(posts) {
		var table = $('#front_runner_table tbody');
		table.empty();

		posts.forEach(function (post) {
			if (!post.title)
				return;

			var row = $(document.createElement('tr'));

			var td = $(document.createElement('td'));
			var link = $(document.createElement('a'));
			link.attr('href', 'https://steemit.com/@' + post.author);
			link.attr('target', '_blank');
			link.text('@' + post.author);
			td.append(link);
			row.append(td);

			var td = $(document.createElement('td'));
			var link = $(document.createElement('a'));
			link.attr('href', 'https://steemit.com' + post.url);
			link.attr('target', '_blank');
			link.text(post.title.length > 40 ? post.title.substr(0, 40) + '...' : post.title);
			td.append(link);
			row.append(td);

			var td = $(document.createElement('td'));
			td.text('$' + post.payout.formatMoney());
			td.css('text-align', 'right');
			row.append(td);

			var td = $(document.createElement('td'));
			td.text('$' + parseFloat(post.amount).formatMoney());
			td.css('text-align', 'right');
			row.append(td);

			var td = $(document.createElement('td'));
			td.text('$' + post.vote_value.formatMoney());
			td.css('text-align', 'right');
			row.append(td);

			var td = $(document.createElement('td'));
			td.text('$' + post.curation_reward.formatMoney() + ' / $1');
			td.css('text-align', 'right');
			row.append(td);

			td = $(document.createElement('td'));
			if(post.voted) {
				td.text('Voted');
			} else {
				var link = $('<button type="button" class="btn btn-info btn-xs"><i class="fa fa-thumbs-up mr5"></i>Upvote</button>');
				link.click(function (e) {
					if(!user)
						window.location.href=sc2.getLoginURL();
					else {
						td.empty();
						td.text('Voting...');
						sc2.vote(user.name, post.author, post.permlink, 10000, function(err, result) {
							console.log(err, result);

							if(result && !err) {
								td.text('Success!');
							} else {
								td.empty();
								td.append(link);
							}
						});
					}
				});
				td.append(link);
			}

			td.css('text-align', 'center');
			row.append(td);

			table.append(row);
		});
	}
});
