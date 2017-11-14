$(function () {
    var RETURN = 1;
    var AUTHOR_REWARDS = 0.75;
    var MIN_VOTE = 0;

    var bots = [
      { name: 'booster', interval: 2.4, comments: true, pre_vote_group_url: 'https://steemit.com/@frontrunner', min_bid: 0.1 },
      { name: 'bellyrub', interval: 2.4, comments: true, min_bid: 1 },
      { name: 'buildawhale', interval: 2.4, comments: true, pre_vote_group_url: 'https://steemit.com/buildawhale/@buildawhale/announcing-the-buildawhale-prevote-club', min_bid: 1 },
      { name: 'boomerang', interval: 2.4, comments: true, min_bid: 0.05 },
      { name: 'minnowhelper', interval: 2.4, comments: true, min_bid: 0.1 },
      { name: 'discordia', interval: 2.4, comments: true, min_bid: 0.05 },
      { name: 'lovejuice', interval: 2.4, comments: true, min_bid: 0.05 },
      { name: 'sneaky-ninja', interval: 2.4, comments: true, min_bid: 0.05 },
      { name: 'upgoater', interval: 2.4, comments: true, min_bid: 0.05 },
      { name: 'voter', interval: 2.4, comments: true, min_bid: 0.05 },
      { name: 'appreciator', interval: 2.4, comments: false, min_bid: 0.05 },
      { name: 'pushup', interval: 2.4, comments: true, min_bid: 0.05 }
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

    function sendRandoWhaleNotification() {
        try {
            if (Notification.permission !== "granted")
                Notification.requestPermission();
            else {
                var notification = new Notification('Randowhale is Awake!', {
                    icon: 'https://i.imgur.com/SEm0LBl.jpg',
                    body: '@randowhale is awake! Send your payment quickly before it goes to sleep again!'
                });

                notification.onclick = function () {
                    window.open("https://steemit.com/@randowhale");
                };
            }
        } catch (err) { }
    }

    var rw_last = false;
    function loadAccountInfo() {
        steem.api.getAccounts(['randowhale'], function (err, result) {
            try {
                var account = result[0];
                var bar = $('#randowhale-progress div');
                var power = getVotingPower(account) / 100;
                bar.attr('aria-valuenow', power);
                bar.css('width', power + '%');
                bar.text(power + '%');

                var time = timeTilFullPower(account) * 1000;
                $('#randowhale-time').attr('time', time);
                $('#randowhale-time').text(toTimer(time));

                var metadata = JSON.parse(account.json_metadata);
                var vote = metadata.config.min_vote;
                $('#randowhale-fee').text('$' + metadata.config.fee_sbd.formatMoney() + ' SBD');
                $('#randowhale-vote').text((vote * 2 / 100).formatMoney() + '%');
                $('#randowhale-value').text('$' + getVoteValue(vote * 2 / 100, account).formatMoney());

                var status = $('#randowhale-status');
                status.removeClass('label-default');
                status.removeClass('label-success');

                if(metadata.config.sleep) {
                    status.text('Sleeping');
                    status.addClass('label-default');
                    rw_last = false;
                } else {
                    status.text('Awake!');
                    status.addClass('label-success');

                    if(!rw_last) {
                        sendRandoWhaleNotification();
                        rw_last = true;
                    }
                }

                var panel = $('#randowhale-panel');
                panel.removeClass('panel-default');
                panel.removeClass('panel-success');
                panel.addClass('panel-' + (metadata.config.sleep ? 'default' : 'success'));
                $('#rw_bot_error').css('display', 'none');
            } catch (err) {
                $('#rw_bot_error').css('display', 'block');
            }
        });

        steem.api.getAccounts(['minnowbooster'], function (err, result) {
            try {
                var account = result[0];
                var bar = $('#minnowbooster-progress div');
                var power = getVotingPower(account) / 100;
                bar.attr('aria-valuenow', power);
                bar.css('width', power + '%');
                bar.text(power + '%');
                var vote = getVoteValue(100, account, STEEMIT_100_PERCENT);
                var weight = 3 / vote;
                //$('#minnowbooster-weight').text((weight * 100).formatMoney(1) + '%');
                $('#minnowbooster-vote').text('$' + (vote * weight * (power / 100)).formatMoney());
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
                $('#mb-upvote-' + i).html('<a href="http://steemit.com/@' + vote.sender_name + '">' + vote.sender_name + '</a> received a <strong>$' + parseFloat(vote.value).formatMoney() + ' upvote for $' + vote.sbd + ' SBD</strong> on <a href="' + vote.url + '">' + vote.url + '</a> at ' + new Date(vote.created_at).toLocaleDateString() + ' ' + new Date(vote.created_at).toLocaleTimeString());
            }
        });

        steem.api.getAccounts(['minnowpond', 'resteembot', 'originalworks', 'treeplanter', 'followforupvotes', 'steemthat', 'frontrunner', 'steemvoter', 'morwhale', 'moonbot', 'drotto'], function (err, result) {
            try {
                result.forEach(function (account) {
                    $('#' + account.name + '-vote').text('$' + getVoteValue(100, account).formatMoney());

                    var metadata = JSON.parse(account.json_metadata);
                    $('#' + account.name + '-desc').text(metadata.profile.about ? metadata.profile.about : '');
                    $('#' + account.name + '-site').html(metadata.profile.website ? '<a target="_blank" href="' + metadata.profile.website + '">' + metadata.profile.website + '</a>' : '');
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

                        if(config.bid_window && parseFloat(config.bid_window) > 0)
                          bot.interval = parseFloat(config.bid_window);

                        if(config.pre_vote_group_url && config.pre_vote_group_url != '')
                          bot.pre_vote_group_url = config.pre_vote_group_url;

                        bot.comments = config.comments;
                      }
                    }

                    steem.api.getAccountHistory(account.name, -1, (first_load) ? 500 : 50, function (err, result) {
                        if (err) return;

                        if (!bot.rounds)
                            bot.rounds = [];

                        var round = null;
                        if (bot.rounds.length == 0) {
                            round = { last_vote_time: 0, bids: [], total: 0 };
                            bot.rounds.push(round);
                        } else
                            round = bot.rounds[bot.rounds.length - 1];

                        result.forEach(function(trans) {
                            var op = trans[1].op;
                            var ts = new Date((trans[1].timestamp) + 'Z');

                            if (op[0] == 'transfer' && op[1].to == account.name && ts > round.last_vote_time) {
                                var existing = round.bids.filter(function (b) { return b.id == trans[0]; });

                                if (existing.length == 0 && op[1].amount.indexOf('STEEM') < 0) {
                                    var amount = parseFloat(op[1].amount.replace(" SBD", ""));

                                    if (amount >= bot.min_bid) {
                                        round.bids.push({ id: trans[0], data: op[1] });
                                        round.total += amount;
                                    }
                                }
                            } else if (op[0] == 'vote' && op[1].voter == account.name) {
                                round = bot.rounds.filter(function (r) { return r.last_vote_time >= (ts - 60 * 60 * 1000); })[0];

                                if (round == null) {
                                    round = { last_vote_time: ts, bids: [], total: 0 };
                                    bot.rounds.push(round);
                                }
                            }
                        });

                        bot.last_vote_time = last_vote_time;
                        bot.vote = vote * bot.interval / 2.4;
                        bot.total = round.total;
                        bot.bid = (bot.vote - RETURN * bot.total) / RETURN;
                        bot.power = getVotingPower(account) / 100;
                        bot.last = (new Date() - last_vote_time);
                        bot.next = timeTilFullPower(account) * 1000;
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

    function checkPost(bot, transId, memo) {
        var permLink = memo.substr(memo.lastIndexOf('/') + 1);
        var author = memo.substring(memo.lastIndexOf('@') + 1, memo.lastIndexOf('/'));

        steem.api.getContent(author, permLink, function (err, result) {
            if (!err && result && result.id > 0) {
                var created = new Date(result.created + 'Z');

                var votes = result.active_votes.filter(function(vote) { return vote.voter == bot.name; });
                if(votes.length > 0 || (new Date() - created) >= ((6 * 24 + 8) * 60 * 60 * 1000)) {
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
        var an = (a.power == 100 && a.last > 5 * HOURS) ? 999 : a.next;
        var bn = (b.power == 100 && b.last > 5 * HOURS) ? 999 : b.next;
        return an - bn;
      });

      bots.forEach(function(bot) {
        if(bot.vote < MIN_VOTE || !bot.vote)
          return;

        // Check that each bid is valid (post age, already voted on, invalid memo, etc.)
        bot.rounds[bot.rounds.length - 1].bids.forEach(function(bid) { checkPost(bot, bid.id, bid.data.memo); });

        bid = (AUTHOR_REWARDS * bot.vote - RETURN * bot.total);

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
            var icon = $('<span class="glyphicon glyphicon-comment" aria-hidden="true" data-toggle="tooltip" data-placement="top" title="Allows Comments"></span>');
            td.append(icon);
        }

        if (bot.pre_vote_group_url && bot.pre_vote_group_url != '') {
            var icon = $('<a href="' + bot.pre_vote_group_url + '" target="_blank">&nbsp;<span class="glyphicon glyphicon-ok" aria-hidden="true" data-toggle="tooltip" data-placement="top" title="This bot has a Pre-Vote Group which will give you additional upvotes - Click for Details"></span></a>');
            td.append(icon);
        }

        row.append(td);

        td = $(document.createElement('td'));
        td.text('$' + bot.vote.formatMoney() + ' (' + (bot.interval / 2.4 * 100) + '%)');
        row.append(td);

        td = $(document.createElement('td'));
        td.text('$' + bot.total.formatMoney());
        row.append(td);

        td = $(document.createElement('td'));
        td.text('$' + Math.max(bid, 0).formatMoney());
        row.append(td);

        td = $(document.createElement('td'));
        var bar = $('#randowhale-progress div').clone();
        var pct = (bot.power - 90) * 10;
        bar.attr('aria-valuenow', pct);
        bar.css('width', pct + '%');
        bar.text(bot.power.formatMoney());

        var div = $(document.createElement('div'));
        div.addClass('progress');
        div.append(bar);
        td.append(div);
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
        var link = $('<a href="javascript:void(0);">Details</a>');
        link.click(function (e) { showBotDetails(bot); });
        td.append(link);
        row.append(td);

        if (bid > 0 && bot.next < 0.16 * HOURS && bot.last > 0.5 * HOURS) {
            row.css('background-color', '#aaffaa');

            if (!bot.notif) {
                sendNotification(bot.name, bid);
                bot.notif = true;
            }
        } else
            bot.notif = false;

        if(bot.power == 100 && bot.last > 3 * HOURS || bot.power < 90)
          row.css('background-color', '#ffaaaa');

        $('#bots_table tbody').append(row);
        $('[data-toggle="tooltip"]').tooltip();
      });
    }

    function showBotDetails(bot) {
        $('#bid_details_bot').text(bot.name);

        var cur_table = $('#bid_details_table_cur tbody');
        cur_table.empty();
        var last_table = $('#bid_details_table_last tbody');
        last_table.empty();

        if (bot.rounds && bot.rounds.length > 0) {
            populateRoundDetailTable(cur_table, bot, bot.rounds[bot.rounds.length - 1]);
            $('#cur_round_vote').text('$' + bot.vote.formatMoney() + ' (' + (bot.interval / 2.4 * 100) + '%)');
            $('#cur_round_bids').text('$' + bot.rounds[bot.rounds.length - 1].total.formatMoney());
        }

        if (bot.rounds && bot.rounds.length > 1) {
            populateRoundDetailTable(last_table, bot, bot.rounds[bot.rounds.length - 2]);
            $('#last_round_vote').text('$' + bot.vote.formatMoney() + ' (' + (bot.interval / 2.4 * 100) + '%)');
            $('#last_round_bids').text('$' + bot.rounds[bot.rounds.length - 2].total.formatMoney());
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
            amount = parseFloat(bid.data.amount.replace(' SBD', ''));
            var row = $(document.createElement('tr'));

            var td = $(document.createElement('td'));
            var link = $(document.createElement('a'));
            link.attr('href', 'http://www.steemit.com/@' + bid.data.from);
            link.attr('target', '_blank');
            link.text('@' + bid.data.from);

            if (bid.invalid) {
                var icon = $('<span class="glyphicon glyphicon-remove" aria-hidden="true" data-toggle="tooltip" data-placement="top" title="Invalid Post"></span>&nbsp;');
                td.append(icon);
            }

            td.append(link);
            row.append(td);

            var td = $(document.createElement('td'));
            td.text('$' + amount.formatMoney());
            td.css('text-align', 'right');
            row.append(td);

            var td = $(document.createElement('td'));
            td.text((amount / round.total * 100).formatMoney() + '%');
            td.css('text-align', 'right');
            row.append(td);

            var td = $(document.createElement('td'));
            td.text('$' + ((amount / round.total) * bot.vote).formatMoney());
            td.css('text-align', 'right');
            row.append(td);

            var td = $(document.createElement('td'));
            var div = $(document.createElement('div'));
            div.css('width', '200px');
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

    var contribots = [
        { name: 'utopian-io', interval: 2.4 }
    ];
    var contribot_names = [];
    contribots.forEach(function (bot) {
      contribot_names.push(bot.name);
    });

    function loadContribBotInfo() {
        steem.api.getAccounts(contribot_names, function (err, result) {
            try {
                result.forEach(function (account) {
                    var vote = getVoteValue(100, account);
                    var last_vote_time = new Date((account.last_vote_time) + 'Z');

                    var bot = contribots.filter(function (b) { return b.name == account.name; })[0];
                    bot.last_vote_time = last_vote_time;
                    bot.vote = vote * bot.interval / 2.4;
                    bot.power = getVotingPower(account) / 100;
                    bot.last = (new Date() - last_vote_time);
                    bot.next = timeTilFullPower(account) * 1000;
                });
            } catch (err) {
                $('#contrib_bot_error').css('display', 'block');
            }

            setTimeout(showContribBotInfo, 5 * 1000);
            setTimeout(loadContribBotInfo, 10 * 1000);
        });
    }

    function showContribBotInfo(bot) {
        contribots.forEach(function(bot) {
            bot.last += 1000;
            bot.next = Math.max(bot.next - 1000, 0);
        });

        $('#contribots_table tbody').empty();

        contribots.forEach(function(bot) {
            if(bot.vote < MIN_VOTE || !bot.vote) { return ; }

            var row = $(document.createElement('tr'));

            var td = $(document.createElement('td'));
            var link = $(document.createElement('a'));
            link.attr('href', 'http://www.steemit.com/@' + bot.name);
            link.attr('target', '_blank');
            var text = '@' + bot.name;

            link.html("<img class='userpic' src='https://steemitimages.com/u/" + bot.name + "/avatar'></img>" + text);
            td.append(link);
            row.append(td);

            td = $(document.createElement('td'));
            td.text('$' + bot.vote.formatMoney() + ' (' + (bot.interval / 2.4 * 100) + '%)');
            row.append(td);

            td = $(document.createElement('td'));
            var bar = $('#randowhale-progress div').clone();
            console.log(bot.power);
            var pct = (bot.power - 90) * 10;
            bar.attr('aria-valuenow', pct);
            bar.css('width', pct + '%');
            bar.text(bot.power.formatMoney());

            var div = $(document.createElement('div'));
            div.addClass('progress');
            div.append(bar);
            td.append(div);
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

            $('#contribots_table tbody').append(row);
            $('[data-toggle="tooltip"]').tooltip();

        });

    }

    setTimeout(loadBotInfo, 5 * 1000);
    setTimeout(loadAccountInfo, 5 * 1000);
    setInterval(updateTimers, 1000);
    setTimeout(loadContribBotInfo, 5 * 1000);

    $('#curation_option').bootstrapSwitch();
    $('#curation_option').on('switchChange.bootstrapSwitch', function(event, state) {
      AUTHOR_REWARDS = state ? 0.75 : 1;
      showBotInfo();
    });

    $('[data-switch-get]').on('click', function () {
      var type = $(this).data('switch-get')
      window.alert($('#switch-' + type).bootstrapSwitch(type))
    })

    $('#min_vote_slider').slider({});
    $('#min_vote_slider').on("slide", function(e) {
      if(e.value != MIN_VOTE) {
        MIN_VOTE = e.value;
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

      var bid = parseFloat($('#bid_amount').val());
      var value = bid / (bid + bot.total) * bot.vote;
      $('#vote_value').text('$' + value.formatMoney());
      $('#vote_value_net').text('$' + (value * 0.75).formatMoney());

      $('#vote_value').css('color', (value >= bid) ? '#008800' : '#FF0000');
      $('#vote_value_net').css('color', ((value * 0.75) >= bid) ? '#008800' : '#FF0000');

      return false;
    });
});
