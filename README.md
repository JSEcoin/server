# server
JSEcoin Node

<h1>JSEcoin</h1>

<h3>Installation</h3>

Before you npm install the server directory you need to add node-gyp
<br><br>
apt update<br>
apt upgrade<br>
apt install node.js<br>
apt install npm<br>
npm i -g node-gyp<br>
npm i -g forever<br>
git init<br>
git remote add jsecoin https://github.com/JSEcoin/server.git<br>
git fetch jsecoin<br>
git pull jsecoin master<br>
cd server<br>
npm install<br>
mkdir logs/ mkdir data/
chmod 777 logs & data
<hr>
ES Lint Continuous:-<br>
ForEach ($number in 1..999999 ) { eslint *.js; eslint */*.js; sleep 10; $number; }
<hr>
<h5>Crontab</h5>
<b>Load Servers</b><br>
<pre>
@reboot cd /var/www/server && /usr/local/bin/forever -c "node --max-old-space-size=3000" start jsenode.js -s load.jsecoin.com -n load4 -m 0 &
35 16 * * * /usr/local/bin/forever restartall
</pre>
<b>Platform Servers</b><br>
<pre>
@reboot cd /var/www/server && /usr/local/bin/forever -c "node --max-old-space-size=3000" start jsenode.js -s server.jsecoin.com -n server1 -m 0 &
5 17 * * * /usr/local/bin/forever restartall
</pre>
<b>Controller</b><br>
<pre>
@reboot cd /var/www/server && /usr/local/bin/forever -c "node --max-old-space-size=3000" start controller.js &
@reboot cd /var/www/server/tools && /usr/local/bin/forever start purgebkups.js &
@reboot cd /var/www/server/tools && /usr/local/bin/forever start systemchecksms.js &
</pre>
<b>Datastore</b><br>
<pre>
@reboot cd /var/www/server && /usr/local/bin/forever -c "node --max-old-space-size=11500" start datastore.js &
</pre>