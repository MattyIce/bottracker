$(function () {
    var RETURN = 1;
    var AUTHOR_REWARDS = 0.75;
    var bots = [
      { name: 'booster', interval: 1.2 },
      { name: 'bellyrub', interval: 2.4 },
      { name: 'buildawhale', interval: 2.4 },
      { name: 'boomerang', interval: 2.4 },
      { name: 'minnowhelper', interval: 2.4 },
      { name: 'discordia', interval: 2.4 },
      { name: 'lovejuice', interval: 2.4 },
      { name: 'sneaky-ninja', interval: 2.4 },
      { name: 'upgoater', interval: 2.4 },
      { name: 'voter', interval: 2.4 }
      /*{ name: 'khoa', interval: 2.4 },
      { name: 'polsza', interval: 2.4 },
      { name: 'drotto', interval: 2.4 }*/
    ];
    var bot_names = [];
    bots.forEach(function (bot) { bot_names.push(bot.name); });

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

    function loadAccountInfo() {
      steem.api.getAccounts(['randowhale'], function (err, result) {
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
        $('#randowhale-vote').text((vote / 100).formatMoney() + '%');
        $('#randowhale-value').text('$' + getVoteValue(vote / 100, account).formatMoney());

        var status = $('#randowhale-status');
        status.removeClass('label-default');
        status.removeClass('label-success');

        if(metadata.config.sleep) {
          status.text('Sleeping');
          status.addClass('label-default');
        } else {
          status.text('Awake!');
          status.addClass('label-success');
          sendRandoWhaleNotification();
        }

        var panel = $('#randowhale-panel');
        panel.removeClass('panel-default');
        panel.removeClass('panel-success');
        panel.addClass('panel-' + (metadata.config.sleep ? 'default' : 'success'));
      });

      steem.api.getAccounts(['minnowbooster'], function (err, result) {
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

      steem.api.getAccounts(['minnowpond', 'resteembot', 'originalworks', 'treeplanter', 'followforupvotes', 'steemthat', 'frontrunner', 'steemvoter', 'morwhale'], function (err, result) {
          result.forEach(function (account) {
              $('#' + account.name + '-vote').text('$' + getVoteValue(100, account).formatMoney());

              var metadata = JSON.parse(account.json_metadata);
              $('#' + account.name + '-desc').text(metadata.profile.about ? metadata.profile.about : '');
              $('#' + account.name + '-site').html(metadata.profile.website ? '<a target="_blank" href="' + metadata.profile.website + '">' + metadata.profile.website + '</a>' : '');
          });
      });

      setTimeout(loadAccountInfo, 60 * 1000);
    }

    function loadBotInfo() {
        steem.api.getAccounts(bot_names, function (err, result) {
            //for(var i = 0; i < result.length; i++) {
            //    var account = result[i];
            result.forEach(function (account) {
                var vote = getVoteValue(100, account);
                var last_vote_time = new Date((account.last_vote_time) + 'Z');

                steem.api.getAccountHistory(account.name, -1, (account.name == 'booster') ? 1000 : 200, function (err, result) {
                    var total = 0, last_date = 0;
                    result.forEach(function(trans) {
                      var op = trans[1].op;
                      var ts = new Date((trans[1].timestamp) + 'Z');

                      if(op[0] == 'transfer' && op[1].to == account.name && ts > last_vote_time)
                        total += parseFloat(op[1].amount.replace(" SBD", ""));
                    });

                    var bot = bots.filter(function(b) { return b.name == account.name; })[0];
                    bot.vote = vote * bot.interval / 2.4;
                    bot.total = total;
                    bot.bid = (AUTHOR_REWARDS * bot.vote - RETURN * total) / RETURN;
                    bot.power = getVotingPower(account) / 100;
                    bot.last = (new Date() - last_vote_time);
                    bot.next = timeTilFullPower(account) * 1000;
                });
            });

            setTimeout(showBotInfo, 5 * 1000);
            setTimeout(loadBotInfo, 30 * 1000);
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
        var row = $(document.createElement('tr'));

        var td = $(document.createElement('td'));
        var link = $(document.createElement('a'));
        link.attr('href', 'http://www.steemit.com/@' + bot.name);

        if(bot.power == 100 && bot.last > 5 * HOURS || bot.power < 90)
          link.text('@' + bot.name + ' (DOWN)');
        else
          link.text('@' + bot.name);

        td.append(link);
        row.append(td);

        td = $(document.createElement('td'));
        td.text('$' + bot.vote.formatMoney() + ' (' + (bot.interval / 2.4 * 100) + '%)');
        row.append(td);

        td = $(document.createElement('td'));
        td.text('$' + bot.total.formatMoney());
        row.append(td);

        td = $(document.createElement('td'));
        td.text('$' + Math.max(bot.bid, 0).formatMoney());
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

        if (bot.bid > 0 && bot.next < 0.16 * HOURS && bot.last > 0.5 * HOURS) {
            row.css('background-color', '#aaffaa');

            if (!bot.notif) {
                sendNotification(bot.name, bot.bid);
                bot.notif = true;
            }
        } else
            bot.notif = false;

        if(bot.power == 100 && bot.last > 5 * HOURS || bot.power < 90)
          row.css('background-color', '#ffaaaa');

        $('#bots_table tbody').append(row);
      });
    }

    setTimeout(loadBotInfo, 5 * 1000);
    setTimeout(loadAccountInfo, 5 * 1000);
    setInterval(updateTimers, 1000);
});
