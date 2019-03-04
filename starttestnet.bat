@echo off
echo Running WAMP...
start "" "C:\wamp64\wampmanager.exe"

echo Starting Datastores...
start powershell -NoExit -Command "node --max-old-space-size=6000 datastore.js -p 82 -n adx,blockChain -t local"
start powershell -NoExit -Command "node --max-old-space-size=4000 datastore.js -p 83 -f blockChain -t local"
start powershell -NoExit -Command "node --max-old-space-size=3000 datastore.js -p 84 -f adx -t local"

echo Sleeping 90 seconds...
ping 127.0.0.1 -n 91 > nul

echo Launching controller, adx and JSE nodes
start powershell -NoExit -Command "node controller.js -t local -d http://localhost:82 -e http://localhost:83 -a http://localhost:84"
start powershell -NoExit -Command "node adx.js -t local -d http://localhost:82 -e http://localhost:83 -a http://localhost:84"
start powershell -NoExit -Command "node jsenode.js -t local -s localhost -p 81 -n jimv18 -d http://localhost:82 -e http://localhost:83 -a http://localhost:84 -m 0"
start powershell -NoExit -Command "node jsenode.js -t local -s localhost -p 86 -n jimconsole -d http://localhost:82 -e http://localhost:83 -a http://localhost:84 -m 0 -i"

echo Sleeping 10 seconds...
ping 127.0.0.1 -n 11 > nul

echo Launching Firefox...
start "" "C:\Program Files\Mozilla Firefox\firefox.exe" file:///C:/shareddocs/jsecoin/admin.html?testnet=local
start "" "C:\Program Files\Mozilla Firefox\firefox.exe" http://localhost/jsecoin/github/v1platform/testnet.html?testnet=local
start "" "C:\Program Files\Mozilla Firefox\firefox.exe" http://localhost/jsecoin/github/server/embed/testpage.html
