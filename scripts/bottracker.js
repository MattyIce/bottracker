$(function () {
    var RETURN = 1;
    var AUTHOR_REWARDS = 0.75;
    var MIN_VOTE = 0;
    var CURRENCY = 'USD';

    var bots = [
      { name: 'booster', interval: 1.2, accepts_steem: true, comments: true, pre_vote_group_url: 'https://steemit.com/@frontrunner', min_bid: 0.1 },
      { name: 'buildawhale', interval: 2.4, accepts_steem: false, comments: true, pre_vote_group_url: 'https://steemit.com/buildawhale/@buildawhale/announcing-the-buildawhale-prevote-club', min_bid: 1 },
      { name: 'boomerang', interval: 2.4, accepts_steem: false, comments: true, min_bid: 0.05 },
      { name: 'minnowhelper', interval: 2.4, accepts_steem: false, comments: true, min_bid: 0.1 },
      { name: 'discordia', interval: 2.4, accepts_steem: false, comments: true, min_bid: 0.05 },
      { name: 'lovejuice', interval: 2.4, accepts_steem: false, comments: true, min_bid: 0.05 },
      { name: 'sneaky-ninja', interval: 2.4, accepts_steem: false, comments: true, min_bid: 0.05 },
      //{ name: 'voter', interval: 2.4, accepts_steem: false, comments: true, min_bid: 0.05 },
      { name: 'appreciator', interval: 2.4, accepts_steem: false, comments: false, min_bid: 0.05 },
      { name: 'pushup', interval: 2.4, accepts_steem: false, comments: true, min_bid: 0.05 },
      { name: 'aksdwi', interval: 2.4, accepts_steem: false, comments: false, min_bid: 0.1, max_bid: 5 },
      { name: 'msp-bidbot', interval: 2.4, accepts_steem: false, comments: true, min_bid: 0.1 },
      { name: 'kittybot', interval: 2.4, accepts_steem: false, comments: true, min_bid: 0.05 },
      { name: 'upmyvote', interval: 2.4, accepts_steem: false, comments: false, min_bid: 1 },
      { name: 'upme', interval: 2.4, accepts_steem: false, comments: true, min_bid: 0.1, refunds: true },
      { name: 'postpromoter', interval: 2.4, accepts_steem: false, comments: true, min_bid: 0.1, refunds: true },
      { name: 'mrswhale', interval: 2.4, accepts_steem: false, comments: false, min_bid: 0.1, min_bid_steem: 0.5 },
      { name: 'hellowhale', interval: 2.4, accepts_steem: false, comments: false, min_bid: 0.05 },
      { name: 'moneymatchgaming', interval: 2.4, accepts_steem: false, comments: false, min_bid: 0.05 },
      { name: 'votebuster', interval: 2.4, accepts_steem: false, comments: false, min_bid: 0.01 },
      { name: 'levitation', interval: 2.4, accepts_steem: false, comments: false, min_bid: 0.1 },
      { name: 'upgoater', interval: 2.4, accepts_steem: true, comments: false, min_bid: 0.1, refunds: true },
      { name: 'allaz', interval: 2.4, accepts_steem: false, comments: false, min_bid: 0.1, refunds: true },
      { name: 'jerrybanfield', interval: 2.4, accepts_steem: true, comments: false, min_bid: 0.1, refunds: true },
      { name: 'smartsteem', interval: 2.4, accepts_steem: true, comments: false, min_bid: 0.1, refunds: true },
      { name: 'upyou', interval: 2.4, accepts_steem: false, comments: true, min_bid: 0.1, refunds: true },
      { name: 'yourwhale', interval: 2.4, accepts_steem: false, comments: true, min_bid: 0.1, refunds: true },
      { name: 'mercurybot', interval: 2.4, accepts_steem: true, comments: false, min_bid: 0.1, refunds: true },
      { name: 'upmewhale', interval: 2.4, accepts_steem: true, comments: false, min_bid: 0.1, refunds: true },
      { name: 'voteme', interval: 2.4, accepts_steem: true, comments: true, min_bid: 0.01, refunds: true }
      /*{ name: 'khoa', interval: 2.4 },
      { name: 'polsza', interval: 2.4 },
      { name: 'drotto', interval: 2.4 }*/
    ];
    var bot_names = [];
    bots.forEach(function (bot) {
      bot_names.push(bot.name);
      $('#bot_list').append('<option value="' + bot.name + '">' + bot.name + '</option>');
    });

    try {
        if (Notification && Notification.permission !== "granted")
            Notification.requestPermission();
    } catch (err) { }

    function sendNotification(bot, bid) {
        try {
            if (Notification.permission !== "granted")
                Notification.requestPermission();
            else {
                var notification = new Notification('Profitable Bidding Opportunity!', {
                    icon: 'https://i.imgur.com/SEm0LBl.jpg',
                    body: "@" + bot + ' is currently showing a profitable bidding opportunity! Max profitable bid is $' + bid.formatMoney() + ' SBD.'
                });

                notification.onclick = function () {
                    window.open("https://steemit.com/@" + bot);
                };
            }
        } catch (err) { }
    }

    function loadPrices() {
      // Load the current prices of STEEM and SBD
      $.get('https://postpromoter.com/api/prices/', function (data) {
        sbd_price = parseFloat(data.sbd_price);
        steem_price = parseFloat(data.steem_price);
        $('#sbd_price').text(sbd_price.formatMoney());
        $('#steem_price').text(steem_price.formatMoney());
      });
    }
    loadPrices();
    setInterval(loadPrices, 30000);

    var smartsteem_loaded = false;
    function loadAccountInfo() {
      steem.api.getAccounts(['smartsteem', 'randowhale'], function (err, result) {
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
              $('#randowhale-desc').text(metadata.profile.about);

              var config = metadata.config;
              var status = $('#randowhale-status');
              status.text(config.sleep ? 'Sleeping' : 'Awake!');

              if(config.sleep)
              {
                status.removeClass('label-success')
                status.addClass('label-default');
              } else {
                status.removeClass('label-default')
                status.addClass('label-success');
              }

              $('#randowhale-fee').text(config.fee_sbd.formatMoney() + ' SBD');

              var bar = $('#randowhale-progress div');
              var power = getVotingPower(account) / 100;
              bar.attr('aria-valuenow', power);
              bar.css('width', power + '%');
              bar.text(power + '%');
              $('#randowhale-vote').text('$' + getVoteValue(100, account).formatMoney());
              $('#rw_bot_error').css('display', 'none');
          } catch (err) {
              $('#ss_bot_error').css('display', 'block');
          }
      });

      if (!smartsteem_loaded) {
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

          smartsteem_loaded = true;
        });
      }

        steem.api.getAccounts(['minnowbooster'], function (err, result) {
            try {
                var account = result[0];
                var bar = $('#minnowbooster-progress div');
                var power = getVotingPower(account) / 100;
                bar.attr('aria-valuenow', power);
                bar.css('width', power + '%');
                bar.text(power + '%');
                //var vote = getVoteValue(100, account, STEEMIT_100_PERCENT);
                //var weight = 2.5 / vote;
                //$('#minnowbooster-vote').text('$' + (vote * weight * (power / 100)).formatMoney());
                $('#minnowbooster-vote').text('$1.60');
                $('#mb_bot_error').css('display', 'none');
            } catch (err) {
                $('#mb_bot_error').css('display', 'block');
            }
        });

        $.get('https://www.minnowbooster.net/api/global', function (data) {
            $('#minnowbooster-min').text('$' + data.min_upvote + ' SBD');
            $('#minnowbooster-day').text('$' + data.daily_limit + ' SBD');
            $('#minnowbooster-week').text('$' + data.weekly_limit + ' SBD');
        });

        $.get('https://www.minnowbooster.net/upvotes.json', function (data) {
            for (var i = 0; i < 5; i++) {
                var vote = data[i];
                $('#mb-upvote-' + i).html('<a href="http://steemit.com/@' + vote.sender_name + '">' + vote.sender_name + '</a> received a <strong>$' + parseFloat(vote.value).formatMoney() + ' upvote for $' + parseFloat(vote.sbd).formatMoney() + ' SBD</strong> on <a href="' + vote.url + '">' + vote.url + '</a> at ' + new Date(vote.created_at).toLocaleDateString() + ' ' + new Date(vote.created_at).toLocaleTimeString());
            }
        });

        steem.api.getAccounts(['hottopic', 'bumper', 'echowhale', 'tipu', 'randofish', 'lays', 'thehumanbot', 'steemvote', 'upvotewhale', 'withsmn', 'minnowpond', 'resteembot', 'originalworks', 'treeplanter', 'followforupvotes', 'steemthat', 'frontrunner', 'steemvoter', 'morwhale', 'moonbot', 'drotto', 'blockgators', 'superbot'], function (err, result) {
          try {
            result.sort(function (a, b) { return getVoteValue(100, b) - getVoteValue(100, a); });

            var container = $('#other_table tbody');

            result.forEach(function (account) {
              var row = $(document.createElement('tr'));
              var td = $('<td><a target="_blank" href="https://steemit.com/@' + account.name + '">@' + account.name + '</a></td>');
              row.append(td);

              td = $('<td>$' + getVoteValue(100, account).formatMoney() + '</td>');
              row.append(td);

              var metadata = JSON.parse(account.json_metadata);

              td = $('<td>' + (metadata.profile.about ? metadata.profile.about : '') + '</td>');
              row.append(td);

              td = $('<td>' + (metadata.profile.website ? '<a target="_blank" href="' + metadata.profile.website + '">' + metadata.profile.website + '</a>' : '') + '</td>');
              row.append(td);
              container.append(row);
            });
            $('#other_bot_error').css('display', 'none');
            } catch (err) {
                $('#other_bot_error').css('display', 'block');
            }
        });

      setTimeout(loadAccountInfo, 60 * 1000);
    }

    var first_load = true;
    function loadBotInfo() {
        steem.api.getAccounts(bot_names, function (err, result) {
            try {
                result.forEach(function (account) {
                    var vote = getVoteValue(100, account);
                    var last_vote_time = new Date((account.last_vote_time) + 'Z');

                    var bot = bots.filter(function (b) { return b.name == account.name; })[0];

                    if(account.json_metadata != null && account.json_metadata != '') {
                      var json_metadata = JSON.parse(account.json_metadata);

                      if(json_metadata && json_metadata.config) {
                        var config = json_metadata.config;

                        if(config.min_bid_sbd && parseFloat(config.min_bid_sbd) > 0)
                          bot.min_bid = parseFloat(config.min_bid_sbd);

                        if(config.min_bid_steem && parseFloat(config.min_bid_steem) > 0)
                          bot.min_bid_steem = parseFloat(config.min_bid_steem);

                        if(config.bid_window && parseFloat(config.bid_window) > 0)
                          bot.interval = parseFloat(config.bid_window);

                        if(config.pre_vote_group_url && config.pre_vote_group_url != '')
                          bot.pre_vote_group_url = config.pre_vote_group_url;

                        if(config.accepts_steem != undefined)
                          bot.accepts_steem = config.accepts_steem;

                        if(config.refunds != undefined)
                          bot.refunds = config.refunds;

                        if(config.comments != undefined)
                          bot.comments = config.comments;

                        if(config.api_url && config.api_url != '')
                          bot.api_url = config.api_url;
                      }
                    }

                    bot.last_vote_time = last_vote_time;
                    bot.vote = vote * bot.interval / 2.4;
                    bot.power = getVotingPower(account) / 100;
                    bot.last = (new Date() - last_vote_time);
                    bot.next = timeTilFullPower(account) * 1000;
                    bot.vote_usd = bot.vote / 2 * sbd_price + bot.vote / 2;

                    if(bot.api_url) {
                      loadFromApi(bot);
                      return;
                    }

                    steem.api.getAccountHistory(account.name, -1, (first_load) ? 500 : 10, function (err, result) {
                        if (err) return;

                        if (!bot.rounds)
                            bot.rounds = [];

                        var round = null;
                        if (bot.rounds.length == 0) {
                            round = { last_vote_time: 0, bids: [], total: 0, total_usd: 0 };
                            bot.rounds.push(round);
                        } else
                            round = bot.rounds[bot.rounds.length - 1];

                        result.forEach(function(trans) {
                            var op = trans[1].op;
                            var ts = new Date((trans[1].timestamp) + 'Z');

                            if (op[0] == 'transfer' && op[1].to == account.name && ts > round.last_vote_time) {
                                // Check that the memo is a valid post or comment URL.
                                if(!checkMemo(op[1].memo))
                                  return;

                                // Get the currency of the bid submitted
                                var currency = getCurrency(op[1].amount);

                                // Check that the bid is not in STEEM unless the bot accepts STEEM.
                                if(!bot.accepts_steem && currency == 'STEEM')
                                  return;

                                var existing = round.bids.filter(function (b) { return b.id == trans[0]; });

                                if (existing.length == 0) {
                                    var amount = parseFloat(op[1].amount);

                                    if (amount >= bot.min_bid) {
                                        round.bids.push({ id: trans[0], data: op[1] });
                                        round.total += amount;
                                        round.total_usd += getUsdValue(op[1]);
                                    }
                                }
                            } else if (op[0] == 'vote' && op[1].voter == account.name) {
                                round = bot.rounds.filter(function (r) { return r.last_vote_time >= (ts - 60 * 60 * 1000); })[0];

                                if (round == null) {
                                    round = { last_vote_time: ts, bids: [], total: 0, total_usd: 0 };
                                    bot.rounds.push(round);
                                }
                            }
                        });

                        bot.total = round.total;
                        bot.total_usd = round.total_usd;
                        bot.bid = (bot.vote - RETURN * bot.total) / RETURN;
                    });
                });

                $('#bid_bot_error').css('display', 'none');
                first_load = false;
            } catch (err) {
                $('#bid_bot_error').css('display', 'block');
            }

            setTimeout(showBotInfo, 5 * 1000);
            setTimeout(loadBotInfo, 30 * 1000);
        });
    }

    function loadFromApi(bot) {
      $.get(bot.api_url, function (data) {
        bot.rounds = [];
        loadRoundFromApi(bot, data.last_round);
        var round = loadRoundFromApi(bot, data.current_round);
        bot.total = round.total;
        bot.total_usd = round.total_usd;
        bot.bid = (bot.vote - RETURN * bot.total) / RETURN;
      });
    }

    function loadRoundFromApi(bot, data) {
      var round = { bids: [], total: 0 };

      if(data == null || data == undefined)
        data = [];

      // Sum the total of all the bids
      round.total = data.reduce(function(total, bid) { return total + bid.amount; }, 0);
      round.total_usd = data.reduce(function(total, bid) { return total + getUsdValue(bid); }, 0);

      // Map the bids to the bot tracker format
      round.bids = data.map(function(bid) {
        return {
          data: {
            amount: bid.amount + ' ' + bid.currency,
            from: bid.sender,
            memo: 'https://steemit.com' + bid.url,
            weight: bid.weight
          }
        }
      });

      bot.rounds.push(round);

      return round;
    }

    function checkMemo(memo) {
      return (memo.lastIndexOf('/') >= 0 && memo.lastIndexOf('@') >= 0);
    }

    function checkPost(bot, transId, memo) {
        var permLink = memo.substr(memo.lastIndexOf('/') + 1);
        var author = memo.substring(memo.lastIndexOf('@') + 1, memo.lastIndexOf('/'));

        steem.api.getContent(author, permLink, function (err, result) {
            if (!err && result && result.id > 0) {
                var created = new Date(result.created + 'Z');

                var votes = result.active_votes.filter(function(vote) { return vote.voter == bot.name; });
                var already_voted = false; //votes.length > 0 && (new Date() - new Date(votes[0].time + 'Z') > 20 * 60 * 1000);

                if(already_voted || (new Date() - created) >= ((6 * 24 + 8) * 60 * 60 * 1000)) {
                    // This post is already voted on by this bot or the post is too old to be voted on
                    removePost(bot, transId);
                }
            } else {
                // Invalid memo
                removePost(bot, transId);
            }
        });
    }

    function removePost(bot, transId) {
        bot.rounds.forEach(function (round) {
            for (var i = 0; i < round.bids.length; i++) {
                var bid = round.bids[i];

                if (!bid.invalid && bid.id == transId) {
                    round.total -= parseFloat(bid.data.amount);
                    bid.invalid = true;
                    return;
                }
            }
        });
    }

    function showBotInfo() {

      if(bots.length == 0 || !bots[0].vote)
        return;

      bots.forEach(function(bot) {
        bot.last += 1000;
        bot.next = Math.max(bot.next - 1000, 0);
      });

      $('#bots_table tbody').empty();

      bots.sort(function(a, b) {
        var an = (a.power == 100 && a.last > 3 * HOURS || a.last < 60 * 1000) ? 9990000000 : a.next;
        var bn = (b.power == 100 && b.last > 3 * HOURS || b.last < 60 * 1000) ? 9990000000 : b.next;
        return an - bn;
      });

      bots.forEach(function(bot) {

        if(bot.vote_usd < MIN_VOTE || !bot.vote || !bot.rounds || bot.rounds.length == 0)
          return;

        // Check that each bid is valid (post age, already voted on, invalid memo, etc.)
        //bot.rounds[bot.rounds.length - 1].bids.forEach(function(bid) { checkPost(bot, bid.id, bid.data.memo); });

        //var bid = (AUTHOR_REWARDS * bot.vote - RETURN * bot.total);
        var bid_sbd = (AUTHOR_REWARDS * bot.vote_usd - RETURN * bot.total_usd) / sbd_price;
        var bid_steem = bot.accepts_steem ? (AUTHOR_REWARDS * bot.vote_usd - RETURN * bot.total_usd) / steem_price : 0;

        var row = $(document.createElement('tr'));

        var td = $(document.createElement('td'));
        var link = $(document.createElement('a'));
        link.attr('href', 'http://www.steemit.com/@' + bot.name);
        link.attr('target', '_blank');
        var text = '@' + bot.name;

        if(bot.power == 100 && bot.last > 3 * HOURS || bot.power < 90)
          text += ' (DOWN)';

        link.html("<img class='userpic' src='https://steemitimages.com/u/" + bot.name + "/avatar'></img>" + text);
        td.append(link);

        if(bot.comments) {
            var icon = $('<span class="fa fa-comment-o ml5" aria-hidden="true" data-toggle="tooltip" data-placement="top" title="Allows Comments"></span>');
            td.append(icon);
        }

        if (bot.pre_vote_group_url && bot.pre_vote_group_url != '') {
            var icon = $('<a href="' + bot.pre_vote_group_url + '" target="_blank">&nbsp;<span class="fa fa-check" aria-hidden="true" data-toggle="tooltip" data-placement="top" title="This bot has a Pre-Vote Group which will give you additional upvotes - Click for Details"></span></a>');
            td.append(icon);
        }

        if(bot.accepts_steem) {
          var icon = $('<img src="img/steem.png" style="width: 20px; margin-left: 5px;" data-toggle="tooltip" data-placement="top" title="This bot accepts STEEM bids!" />');
          td.append(icon);
        }

        if(bot.refunds) {
            var icon = $('<img src="img/refund.png" style="width: 20px; margin-left: 5px;" data-toggle="tooltip" data-placement="top" title="This bot automatically refunds invalid bids!" />');
            td.append(icon);
        }

        row.append(td);

        td = $(document.createElement('td'));
        td.text(formatCurrencyVote(bot) + ' (' + (bot.interval / 2.4 * 100) + '%)');
        row.append(td);

        var steem_bid = '';
        if(bot.accepts_steem){
          if(bot.min_bid_steem && bot.min_bid_steem != bot.min_bid_sbd)
            steem_bid = ' or ' + bot.min_bid_steem.formatMoney() + ' STEEM';
          else
            steem_bid = ' or STEEM';
        }

        td = $(document.createElement('td'));
        td.text(bot.min_bid.formatMoney() + ' SBD' + steem_bid);
        row.append(td);

        td = $(document.createElement('td'));
        td.text(formatCurrencyTotal(bot));
        row.append(td);

        td = $(document.createElement('td'));
        if (bot.accepts_steem)
          td.text(Math.max(bid_steem, 0).formatMoney() + ' STEEM or ' + Math.max(bid_sbd, 0).formatMoney() + ' SBD');
        else
          td.text(Math.max(bid_sbd, 0).formatMoney() + ' SBD');

        row.append(td);

/*
        td = $(document.createElement('td'));
        var bar = $('#minnowbooster-progress div').clone();
        var pct = (bot.power - 90) * 10;
        bar.attr('aria-valuenow', pct);
        bar.css('width', pct + '%');
        bar.text(bot.power.formatMoney());

        var div = $(document.createElement('div'));
        div.addClass('progress flat');
        div.append(bar);
        td.append(div);
        row.append(td);
*/

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
        var link = $('<a href="javascript:void(0);"><i class="fa fa-eye mr5"></i>Details</a>');
        link.click(function (e) { showBotDetails(bot); });
        td.append(link);
        row.append(td);

        if ((bid_sbd > 0 || bid_steem > 0) && bot.next < 0.16 * HOURS && bot.last > 0.5 * HOURS) {
            row.addClass('green-bg');

            if (!bot.notif) {
                sendNotification(bot.name, bid_sbd);
                bot.notif = true;
            }
        } else
            bot.notif = false;

        if(bot.power == 100 && bot.last > 3 * HOURS || bot.power < 90)
          row.addClass('red-light-bg');

        $('#bots_table tbody').append(row);
        $('[data-toggle="tooltip"]').tooltip();
      });
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
      return round.bids.reduce(function(total, bid) {
        if(getCurrency(bid.data.amount) == currency)
          return total + parseFloat(bid.data.amount);
        else
          return total;
      }, 0);
    }

    function showBotDetails(bot) {
        $('#bid_details_bot').text(bot.name);

        var cur_table = $('#bid_details_table_cur tbody');
        cur_table.empty();
        var last_table = $('#bid_details_table_last tbody');
        last_table.empty();

        if (bot.rounds && bot.rounds.length > 0) {
          var round = bot.rounds[bot.rounds.length - 1];
          populateRoundDetailTable(cur_table, bot, round);

          $('#cur_round_vote').text(formatCurrencyVote(bot) + ' (' + (bot.interval / 2.4 * 100) + '%)');
          $('#cur_round_bids').text(sumBids(round, 'SBD').formatMoney() + ' SBD' + (bot.accepts_steem ? ' & ' + sumBids(round, 'STEEM').formatMoney() + ' STEEM' : ''));
          $('#cur_round_value').text('$' + bot.total_usd.formatMoney());
          $('#cur_round_roi').text((((bot.vote_usd * AUTHOR_REWARDS / round.total_usd) - 1) * 100).formatMoney() + '% (After Curation)');
        }

        if (bot.rounds && bot.rounds.length > 1) {
          var round = bot.rounds[bot.rounds.length - 2];
          populateRoundDetailTable(last_table, bot, round);
          $('#last_round_vote').text(formatCurrencyVote(bot) + ' (' + (bot.interval / 2.4 * 100) + '%)');
          $('#last_round_bids').text(sumBids(round, 'SBD').formatMoney() + ' SBD' + (bot.accepts_steem ? ' & ' + sumBids(round, 'STEEM').formatMoney() + ' STEEM' : ''));
          $('#last_round_value').text('$' + round.total_usd.formatMoney());
          $('#last_round_roi').text((((bot.vote_usd * AUTHOR_REWARDS / round.total_usd) - 1) * 100).formatMoney() + '% (After Curation)');
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

        $('#bid_details').modal();
    }

    function populateRoundDetailTable(table, bot, round) {
        round.bids.forEach(function (bid) {
            var amount = parseFloat(bid.data.amount);
            var bid_value = getUsdValue(bid.data);
            var currency = getCurrency(bid.data.amount);
            var row = $(document.createElement('tr'));

            var td = $(document.createElement('td'));
            var link = $(document.createElement('a'));
            link.attr('href', 'http://www.steemit.com/@' + bid.data.from);
            link.attr('target', '_blank');
            link.text('@' + bid.data.from);

            if (bid.invalid) {
                var icon = $('<span class="fa fa-warning mr5 color-white" aria-hidden="true" data-toggle="tooltip" data-placement="top" title="Invalid Post"></span>&nbsp;');
                td.append(icon);
                row.addClass('red-light-bg');
            }

            td.append(link);
            row.append(td);

            var td = $(document.createElement('td'));
            td.text(amount.formatMoney() + ' ' + currency);
            td.css('text-align', 'right');
            row.append(td);

            var td = $(document.createElement('td'));
            td.text('$' + ((currency == 'SBD') ? amount * sbd_price : amount * steem_price).formatMoney());
            td.css('text-align', 'right');
            row.append(td);

            var td = $(document.createElement('td'));
            td.text((bid_value / round.total_usd * 100).formatMoney() + '%');
            td.css('text-align', 'right');
            row.append(td);

            var value = ((bid_value / round.total_usd) * parseFloat(formatCurrencyVote(bot).replace(/[$,]/g, ''))).formatMoney();

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
            link.attr('href', bid.data.memo);
            link.attr('target', '_blank');
            link.text(bid.data.memo);
            div.append(link);
            td.append(div);
            row.append(td);

            table.append(row);
        });
    }

    setTimeout(loadBotInfo, 5 * 1000);
    setTimeout(loadAccountInfo, 5 * 1000);
    setInterval(updateTimers, 1000);

    $('#curation_option').on('change', function () {
        if(this.checked) {
            AUTHOR_REWARDS = 0.75;
        } else {
            AUTHOR_REWARDS = 1;
        }
        showBotInfo();
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
      showBotInfo();
    });

    $('#min_vote_slider').slider();

    //remember slider choice
    if (!localStorage.hasOwnProperty('min_vote_slider')) {
      localStorage.setItem('min_vote_slider', 0);
    } else {
      $('#min_vote_slider').slider('setValue', localStorage.getItem('min_vote_slider'));
      MIN_VOTE = localStorage.getItem('min_vote_slider');
    }

    $('#min_vote_slider').on("slide", function(e) {
      if(e.value != MIN_VOTE) {
        MIN_VOTE = e.value;
        localStorage.setItem('min_vote_slider', e.value);
        showBotInfo();
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
      var value = bid / (bid + bot.total) * bot.vote_usd;
      var value_sbd = (bid / (bid + bot.total) * bot.vote) / 2;
      var value_steem = ((bid / (bid + bot.total) * bot.vote) / 2 / steem_price);
      var bid_value = (currency == 'SBD') ? bid * sbd_price : bid * steem_price;

      $('#bid_value').text('$' + bid_value.formatMoney());
      $('#vote_value').text('$' + value.formatMoney() + ' = ' + value_sbd.formatMoney() + ' SBD + ' + value_steem.formatMoney() + ' STEEM');
      $('#vote_value_net').text('$' + (value * 0.75).formatMoney() + ' = ' + (value_sbd * 0.75).formatMoney() + ' SBD + ' + (value_steem * 0.75).formatMoney() + ' STEEM');

      $('#vote_value').css('color', (value >= bid_value) ? '#008800' : '#FF0000');
      $('#vote_value_net').css('color', ((value * 0.75) >= bid_value) ? '#008800' : '#FF0000');

      return false;
    });

    // Show disclaimer message
    setTimeout(function () { $('#disclaimer').modal(); }, 2000);
});
