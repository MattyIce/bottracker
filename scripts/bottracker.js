$(function () {
    var RETURN = 1;
    var AUTHOR_REWARDS = 0.75;
    var MIN_VOTE = 0;
    var CURRENCY = 'USD';
    var bots = [];
    var bot_names = [];
    var other_bots = [];

    $.get('https://steembottracker.com/bidbots.json', function (data) {
      bots = data;

      bots.sort(function(a, b){
        if(a.name < b.name) return -1;
        if(a.name > b.name) return 1;
        return 0;
      });

      bots.forEach(function (bot) {
        bot_names.push(bot.name);
        $('#bot_list').append('<option value="' + bot.name + '">' + bot.name + '</option>');
      });
    });

    $.get('https://steembottracker.com/otherbots.json', function (data) { other_bots = data; });

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
            }
        } catch (err) { }
    }

    function loadPrices() {
      // Load the current prices of STEEM and SBD
      $.get('https://api.coinmarketcap.com/v1/ticker/steem/', function (data) {
        steem_price = parseFloat(data[0].price_usd);
        $('#steem_price').text(steem_price.formatMoney());
      });

      // Load the current prices of STEEM and SBD
      $.get('https://api.coinmarketcap.com/v1/ticker/steem-dollars/', function (data) {
        sbd_price = parseFloat(data[0].price_usd);
        $('#sbd_price').text(sbd_price.formatMoney());
      });
    }
    loadPrices();
    setInterval(loadPrices, 30000);

    var smartsteem_loaded = false;
    function loadAccountInfo() {
      steem.api.getAccounts(['smartsteem', 'randowhale', 'minnowbooster'], function (err, result) {
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
                $('#randowhale-submit').attr('disabled', 'disabled');
              } else {
                status.removeClass('label-default')
                status.addClass('label-success');
                $('#randowhale-submit').removeAttr('disabled');
              }

              $('#randowhale-fee').text(config.fee_sbd.formatMoney() + ' SBD');

              var bar = $('#randowhale-progress div');
              var power = getVotingPower(account) / 100;
              bar.attr('aria-valuenow', power);
              bar.css('width', power + '%');
              bar.text(power + '%');
              $('#randowhale-vote').text('$' + getVoteValue(100, account).formatMoney());
              $('#rw_bot_error').css('display', 'none');

              account = result[2];
              var bar = $('#minnowbooster-progress div');
              var power = getVotingPower(account) / 100;
              bar.attr('aria-valuenow', power);
              bar.css('width', power + '%');
              bar.text(power + '%');
              $('#minnowbooster-vote').text('$' + getVoteValue(100, account).formatMoney());
              $('#mb_bot_error').css('display', 'none');
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

        $.get('https://www.minnowbooster.net/api/global', function (data) {
            $('#minnowbooster-min').text('$' + data.min_upvote + ' SBD');
        });

        $.get('https://www.minnowbooster.net/upvotes.json', function (data) {
            for (var i = 0; i < 5; i++) {
                var vote = data[i];
                $('#mb-upvote-' + i).html('<a href="http://steemit.com/@' + vote.sender_name + '">' + vote.sender_name + '</a> received a <strong>$' + parseFloat(vote.value).formatMoney() + ' upvote for $' + parseFloat(vote.sbd).formatMoney() + ' SBD</strong> on <a href="' + vote.url + '">' + vote.url + '</a> at ' + new Date(vote.created_at).toLocaleDateString() + ' ' + new Date(vote.created_at).toLocaleTimeString());
            }
        });

        steem.api.getAccounts(other_bots, function (err, result) {
          try {
            result.sort(function (a, b) { return getVoteValue(100, b) - getVoteValue(100, a); });

            var container = $('#other_table tbody');
            container.empty();

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

      setTimeout(loadAccountInfo, 60 * 10 * 1000);
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

                        if (config.funding_url && config.funding_url != '')
                          bot.funding_url = config.funding_url;

                        if(config.accepts_steem != undefined)
                          bot.accepts_steem = config.accepts_steem;

                        if(config.refunds != undefined)
                          bot.refunds = config.refunds;

                        if(config.comments != undefined)
                          bot.comments = config.comments;

                        if (config.is_disabled != undefined)
                          bot.is_disabled = config.is_disabled;

                        if(config.api_url && config.api_url != '')
                          bot.api_url = config.api_url;

                        if (config.max_post_age && parseFloat(config.max_post_age) > 0)
                          bot.max_post_age = parseFloat(config.max_post_age);
                      }
                    }

                    // Don't list bots that have indicated that they are disabled.
                    if (bot.is_disabled)
                      return;

                    bot.last_vote_time = last_vote_time;
                    bot.vote = vote * bot.interval / 2.4;
                    bot.power = getVotingPower(account) / 100;
                    bot.last = (new Date() - last_vote_time);
                    bot.next = timeTilFullPower(account) * 1000;
                    bot.vote_usd = bot.vote / 2 * sbd_price + bot.vote / 2;

                    // Don't load bots that are filtered out
                    if (bot.vote_usd < MIN_VOTE || (_filter.verified && !bot.api_url) || (_filter.refund && !bot.refunds) || (_filter.steem && !bot.accepts_steem) || (_filter.frontrunner && !bot.pre_vote_group_url) || (_filter.funding && !bot.funding_url))
                      return;

                    // Set the frequency of reload based on how close to the end of the round the bot is
                    var frequency = 300;
                    if (bot.next < 5 * 60 * 1000)
                      frequency = 10;
                    else if (bot.next < 20 * 60 * 1000)
                      frequency = 30;

                    // Check if the bot is ready to be refreshed based on the above defined frequency.
                    if (new Date() - bot.last_update < frequency * 1000)
                      return;

                    // Note when the bot was last updated.
                    bot.last_update = new Date();

                    if(bot.api_url) {
                      loadFromApi(bot);
                      return;
                    }

                    var transactions = 20;
                    if (first_load)
                      transactions = 2000;

                    steem.api.getAccountHistory(account.name, -1, transactions, function (err, result) {
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
                              round = bot.rounds.filter(function (r) { return r.last_vote_time >= (ts - 120 * 60 * 1000); })[0];

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
            setTimeout(loadBotInfo, 10 * 1000);
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

      $('#bots_table tbody').empty();

      bots.sort(function(a, b) {
        var an = (a.power == 100 && a.last > 3 * HOURS || a.last < 60 * 1000) ? 9990000000 : a.next;
        var bn = (b.power == 100 && b.last > 3 * HOURS || b.last < 60 * 1000) ? 9990000000 : b.next;
        return an - bn;
      });

      bots.forEach(function(bot) {

        if(bot.vote_usd < MIN_VOTE || !bot.vote || !bot.rounds || bot.rounds.length == 0 || bot.is_disabled)
          return;

        // Don't show bots that are filtered out
        if ((_filter.verified && !bot.api_url) || (_filter.refund && !bot.refunds) || (_filter.steem && !bot.accepts_steem) || (_filter.frontrunner && !bot.pre_vote_group_url) || (_filter.funding && !bot.funding_url))
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

        if(bot.power == 100 && bot.last > 4 * HOURS || bot.power < 90)
          text += ' (DOWN)';

        link.html("<img class='userpic' src='https://steemitimages.com/u/" + bot.name + "/avatar'></img>" + text);
        td.append(link);

        if(bot.comments) {
            var icon = $('<span class="fa fa-comment-o ml5" aria-hidden="true" data-toggle="tooltip" data-placement="top" title="Allows Comments"></span>');
            td.append(icon);
        }

        if (bot.pre_vote_group_url && bot.pre_vote_group_url != '') {
          var icon = $('<a href="' + bot.pre_vote_group_url + '" target="_blank">&nbsp;<img src="img/frontrunner.png" style="width: 20px; margin-left: 5px;" aria-hidden="true" data-toggle="tooltip" data-placement="top" title="This bot has a Pre-Vote Group which will give you additional upvotes - Click for Details"/></a>');
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

        if (bot.api_url) {
          var guarantee = $('<img src="img/verified.png" style="width: 20px; margin-left: 5px;" data-toggle="tooltip" data-placement="top" title="This bot provides a bid API so the data shown here is guaranteed to be accurate!" />');
          td.append(guarantee);
        }

        if (bot.funding_url) {
          var icon = $('<a href="' + bot.funding_url + '" target="_blank"><img src="img/funding.png" style="width: 20px; margin-left: 5px;" aria-hidden="true" data-toggle="tooltip" data-placement="top" title="This bot uses a portion of its earnings to fund other projects and initiatives - Click for Details"/></a>');
          td.append(icon);
        }

        row.append(td);

        td = $(document.createElement('td'));
        td.text(formatCurrencyVote(bot));
        row.append(td);

        var steem_bid = '';
        if(bot.accepts_steem){
          if(bot.min_bid_steem && bot.min_bid_steem != bot.min_bid)
            steem_bid = ' or ' + bot.min_bid_steem.formatMoney() + ' <img src="img/steem.png" style="width: 17px; vertical-align: top;"/>';
          else
            steem_bid = ' or <img src="img/steem.png" style="width: 17px; vertical-align: top;"/>';
        }

        td = $(document.createElement('td'));
        td.html(bot.min_bid.formatMoney() + ' SBD' + steem_bid);
        row.append(td);

        td = $(document.createElement('td'));
        td.text((bot.max_post_age ? bot.max_post_age + ' days' : 'unknown'));
        row.append(td);

        td = $(document.createElement('td'));
        td.text(formatCurrencyTotal(bot));
        row.append(td);

        td = $(document.createElement('td'));
        if (bot.accepts_steem)
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
        var link = $('<button type="button" class="btn btn-info btn-xs"><i class="fa fa-eye mr5"></i>Details</button>');
        link.click(function (e) { showBotDetails(bot); });
        td.append(link);
        row.append(td);

        td = $(document.createElement('td'));
        var link = $('<button type="button" class="btn btn-warning btn-xs"><i class="fa fa-upload mr5"></i>Send Bid</button>');
        link.click(function (e) { sendBid(bot); });
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

        if(bot.power == 100 && bot.last > 4 * HOURS || bot.power < 90)
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

    var _dialog = null;

    function sendBid(bot) {
      $('#bid_details_dialog_bot_name').text(bot.name);
      $('#bid_details_error').hide();
      $('#bid_details_btn_submit').click(submitBid);
      $('#bid_details_post_url').val('');
      $('#bid_details_bid_amount').val(bot.min_bid)
      $('#bid_details_bid_amount').attr("min", bot.min_bid);
      _dialog = $('#bid_details_dialog').modal();
      _dialog.off('hidden.bs.modal');
      _dialog.bot = bot;

      var account_name = user ? user.name : localStorage.getItem('bid_details_account_name');
      if (account_name) {
        $('#bid_details_account_name').val(account_name);
        loadRecentPosts();
      }
    }

    function submitBid() {
      var to = $('#bid_details_dialog_bot_name').text();
      var from = $('#bid_details_account_name').val();
      var amount = $('#bid_details_bid_amount').val();
      var currency = $('#bid_details_bid_currency').val();
      var url = $('#bid_details_post_url').val();

      checkPost(_dialog.bot, url, amount, currency, function (error) {
        if (error) {
          $('#bid_details_error').html('<b>Error:</b> ' + error);
          $('#bid_details_error').show();
        } else {
          _dialog.on('hidden.bs.modal', function (e) {
            $('#bid_dialog_bot_name').text(to);
            $('#bid_dialog_frame').attr('src', 'https://v2.steemconnect.com/sign/transfer?from=' + from + '&to=' + to + '&amount=' + amount + ' ' + currency + '&memo=' + url);
            _dialog = $('#bid_dialog').modal();
          });

          _dialog.modal('hide');
        }
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

    $('#bid_details_account_name').on("change", function(e) {
      localStorage.setItem('bid_details_account_name', $('#bid_details_account_name').val());
      loadRecentPosts();
    });

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

    $('#filter_verified').click(function () { toggleFilter('verified'); });
    $('#filter_refund').click(function () { toggleFilter('refund'); });
    $('#filter_steem').click(function () { toggleFilter('steem'); });
    $('#filter_frontrunner').click(function () { toggleFilter('frontrunner'); });
    $('#filter_funding').click(function () { toggleFilter('funding'); });

    var _filter = {};
    function toggleFilter(filter) {
      _filter[filter] = !_filter[filter];
      $('#filter_' + filter).css('border', _filter[filter] ? '2px solid green' : 'none');
      showBotInfo();
    }

    $('#minnowbooster-submit').click(function () { sendBid({ name: 'minnowbooster', min_bid: 0.01, max_post_age: 6.3 }); });
    $('#randowhale-submit').click(function () { sendBid({ name: 'randowhale', min_bid: 1, max_post_age: 3.5 }); });
    $('#smartsteem-submit').click(function () { sendBid({ name: 'smartmarket', min_bid: 0.1, max_post_age: 6.3 }); });

    // Initialize and try to log in with SteemConnect V2
    var token = getURLParameter('access_token') ? getURLParameter('access_token') : localStorage.getItem('access_token');
    sc2.init({
      baseURL: 'https://v2.steemconnect.com',
      app: 'bottracker.app',
      accessToken: token,
      callbackURL: 'https://steembottracker.com',
      scope: ['login', 'vote']
    });

    var user = null;
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

    function loadUserBids() {
      steem.api.getAccountHistory(user.name, -1, 1000, function (err, result) {
        var bids = [];
        var num_loaded = 0;

        for (var i = 0; i < result.length; i++) {
          var trans = result[i];
          var op = trans[1].op;
          var bid = op[1];

          if (op[0] == 'transfer' && bot_names.indexOf(bid.to) >= 0) {
            // Check that the memo is a valid post or comment URL.
            if (!checkMemo(bid.memo))
              continue;

            bids.push(bid);
            loadUserContent(bid, function () {
              num_loaded++;

              if (num_loaded >= bids.length) {
                console.log(bids);
                populateUserBids(bids);
              }
            });
          } else if (op[0] == 'transfer' && bot_names.indexOf(op[1].from) >= 0) {
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
      var big_bots = bots.filter(function(b) { return b.vote >= 100; });
      var posts = [];
      var l = big_bots.length;

      for (var i = 0; i < l; i++) {
        var bot = big_bots[i];
        var bids = bot.rounds[bot.rounds.length - 1].bids.filter(function(b) { return parseFloat(b.data.amount) >= 10; });

        for (var j = 0; j < bids.length; j++) {
          var bid = bids[j];
          var post = posts.find(function(p) { return p.memo == bid.data.memo; });

          var bid_value = getUsdValue(bid.data);
          var vote_value = bot.vote * (bid_value / (bot.vote_usd * AUTHOR_REWARDS));

          if (post) {
            if(!post.currency)
              post.currency = getCurrency(post.amount);

            post.amount = parseFloat(post.amount) + parseFloat(bid.data.amount);
            post.bots.push(bot.name);
            post.vote_value += vote_value;
          } else {
            bid.data.bots = [bot.name];
            bid.data.vote_value = vote_value;
            posts.push(bid.data);
          }
        }
      }

      var num_loaded = 0;
      posts.forEach(function (post) {
        var permLink = post.memo.substr(post.memo.lastIndexOf('/') + 1);
        var author = post.memo.substring(post.memo.lastIndexOf('@') + 1, post.memo.lastIndexOf('/'));

        steem.api.getContent(author, permLink, function (err, result) {
          if (!err && result && result.id > 0) {
            post.created = new Date(result.created + 'Z');
            post.payout = parseFloat(result.pending_payout_value);
            post.title = result.title;
            post.author = result.author;
            post.permlink = result.permlink;
            post.curation_reward = (Math.sqrt((post.payout + 1) * 0.25) - Math.sqrt(post.payout * 0.25)) * Math.sqrt((post.payout + 1 + post.vote_value) * 0.25);

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
        link.attr('href', post.memo);
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
        td.text(((post.curation_reward - 1) * 100).formatMoney() + '%');
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

    $('#btn_front_run').click(function() {
      loadFrontRunnerPosts();
      $('#front_runner_dialog').modal();
    });
});
