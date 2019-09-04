# JSEcoin Node

The JSEcoin node (jsenode.js) runs as part of the JSEcoin peer to peer network.

## Local Installation

```bash
npm install
npm i -g node-gyp
npm i -g forever
git init
git remote add jsecoin https://github.com/JSEcoin/server.git
git fetch jsecoin
git pull jsecoin master
npm install
mkdir logs/
mkdir data/

node jsenode.js -s localhost -n jsetestnet
```
---

## Testnet Installation

```bash
npm install
npm i -g node-gyp
npm i -g forever
git init
git remote add jsecoin https://github.com/JSEcoin/server.git
git fetch jsecoin
git pull jsecoin master
npm install
mkdir logs/
mkdir data/

node --max-old-space-size=3000 datastore.js -p 82 -t local
node --max-old-space-size=3000 datastore.js -p 83 -t local
node controller.js -t local -d http://localhost:82 -e http://localhost:83
node jsenode.js -t local -s localhost -p 81 -n jimv18 -d http://localhost:82 -e http://localhost:83 -m 0

npm run test
node jsenode.js -d http://localhost:82 -e http://localhost:83 -m 0 -i
http://localhost/jsecoin/github/v1platform/testnet.html?testnet=local
```

---

## Production Installation
Before you npm install the server directory you need to add node-gyp

```bash
apt update
apt upgrade -y
apt install node.js -y
apt install npm -y
npm i -g node-gyp
npm i -g forever
git init
git remote add jsecoin https://github.com/JSEcoin/server.git
git fetch jsecoin
git pull jsecoin master
npm install
mkdir logs/
mkdir data/
chmod 777 logs
chmod 777 data
```

---

ES Lint Continuous:-
`ForEach ($number in 1..999999 ) { eslint *.js; eslint */*.js; sleep 10; $number; }`

---

### Crontab

**Load Servers**
```console
@reboot cd /root && /usr/local/bin/forever -c "node --max-old-space-size=3000" start jsenode.js -s load.jsecoin.com -n load4 -m 0 &
35 16 * * * /usr/local/bin/forever restartall
```

**Platform Servers**
```console
@reboot cd /root && /usr/local/bin/forever -c "node --max-old-space-size=3000" start jsenode.js -s server.jsecoin.com -n server1 -m 0 &
5 17 * * * /usr/local/bin/forever restartall
```


**Controller**
```console
@reboot cd /root && /usr/local/bin/forever -c "node --max-old-space-size=3000" start controller.js &
@reboot cd /root/tools && /usr/local/bin/forever start purgebkups.js &
@reboot cd /root/tools && /usr/local/bin/forever start systemchecksms.js &
```


**Datastore**
```console
@reboot cd /root && /usr/local/bin/forever -c "node --max-old-space-size=10000" start datastore.js -f blockChain &
```

**AdX**
```console
@reboot cd /var/www && /usr/local/bin/forever -c "node --max-old-space-size=8000" start datastore.js -p 81 -f adx &
@reboot cd /var/www && /usr/local/bin/forever -c "node --max-old-space-size=3000" start adx.js &
```


## Bug Bounty
This is an initial push alot of cleanup is still required if you spot an issue please report it and if we consider it a major issue we will credit your account as part of our bug bounty offering.
[Bug Bounty Info Page](https://jsecoin.com/en/oddJobs/bugBounty)

## Contribute
If you'd like to assist and help the team please first review our [Contribution Guidelines](./CONTRIBUTING.md).

## License
This project is under the [GNU General Public License v3.0](./LICENSE.md).