# JSEcoin Node

The JSEcoin node (jsenode.js) runs as part of the JSEcoin peer to peer network.

Bug bounty is available for responsible disclosure of security vulnerabilities: 
[https://jsecoin.com/en/oddJobs/bugBounty/](https://jsecoin.com/en/oddJobs/bugBounty/)


Developers please get in touch if you would like to contribute to the JSEcoin core codebase.

## Local Installation

```bash
npm install
npm i -g node-gyp
npm i -g forever
git init
git remote add jsecoin https://github.com/JSEcoin/server.git
git fetch jsecoin
git pull jsecoin master
cd server
npm install
mkdir logs/ mkdir data/

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
cd server
npm install
mkdir logs/ mkdir data/

node datastore.js
node controller.js
node jsenode.js -s localhost -n jsetestnet -t local
```

---

## Production Installation
Before you npm install the server directory you need to add node-gyp

```bash
apt update
apt upgrade
apt install node.js
apt install npm
npm i -g node-gyp
npm i -g forever
git init
git remote add jsecoin https://github.com/JSEcoin/server.git
git fetch jsecoin
git pull jsecoin master
cd server
npm install
mkdir logs/ mkdir data/
chmod 777 logs & data
```

---

ES Lint Continuous:-
`ForEach ($number in 1..999999 ) { eslint *.js; eslint */*.js; sleep 10; $number; }`

---

### Crontab

**Load Servers**
```console
@reboot cd /var/www/server && /usr/local/bin/forever -c "node --max-old-space-size=3000" start jsenode.js -s load.jsecoin.com -n load4 -m 0 &
35 16 * * * /usr/local/bin/forever restartall
```

**Platform Servers**
```console
@reboot cd /var/www/server && /usr/local/bin/forever -c "node --max-old-space-size=3000" start jsenode.js -s server.jsecoin.com -n server1 -m 0 &
5 17 * * * /usr/local/bin/forever restartall
```


**Controller**
```console
@reboot cd /var/www/server && /usr/local/bin/forever -c "node --max-old-space-size=3000" start controller.js &
@reboot cd /var/www/server/tools && /usr/local/bin/forever start purgebkups.js &
@reboot cd /var/www/server/tools && /usr/local/bin/forever start systemchecksms.js &
```


**Datastore**
```console
@reboot cd /var/www/server && /usr/local/bin/forever -c "node --max-old-space-size=11500" start datastore.js &
```


## Bug Bounty
This is an initial push alot of cleanup is still required if you spot an issue please report it and if we consider it a major issue we will credit your account as part of our bug bounty offering.
[Bug Bounty Info Page](https://jsecoin.com/en/oddJobs/bugBounty)

## Contribute
If you'd like to assist and help the team please first review our [Contribution Guidelines](./CONTRIBUTING.md).

## License
This project is under the [GNU General Public License v3.0](./LICENSE.md).