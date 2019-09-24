var correct = 0;
document.getElementById('JSE-captcha-game-container').style.background = '#FFF';
document.getElementById('JSE-captcha-game').style.cursor = "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAMAAAAM7l6QAAACnVBMVEVRUVNTVFRTVFWwFRH////ADAvCDQtSU1ZTVFVVVlRXWFlYWVvHCQlUVVVUVVdUVVlVVldWV1ZWV11YWV5WV1lYWVtXWFpXWFpYWVpYWVtXWFpYWVtXWFpXWFpYWVpXWFpYWVpYWVoEBAQEBAQEBATHPDcDAwMEBATHOzYDBAPIOjYAAAABAQABAQECAgIDAwPIOTTJODMiIiMjJCQgICEhISIhIiIfHyAgICEPDw8PDw9XWFpYWVoSEhITExMREREREhESEhITExMUFBRYWVpYWVsSExMTExMTExRYWVtYWVtYWVtYWVtYWVs/QEI+Pj88PT4/QEE6Ozw/P0E9Pj88PT0rLC0qKisqKyspKSotLi8rLCwsLS0xMjMrKywxMTIvMDEwMDExMjMyMzQzMzQwMTJYWVpYWVtYWVpYWVtYWVpYWVtYWVpYWVpYWVtYWVpYWVtYWVpYWVtYWVtYWVtYWVtOTk9OTk9OT09YWVtNTlBOT1FNTlBYWVtMTU5MTU9NTk/KOzZTVFbKOTXLOjVMTU9NTU9SU1RUVVXLODRNTU9NTk9RUlRSU1RUVFVJSkxLTE1JSktKS01KS01YWVtJSUpLTE1YWVtKSkxYWVtXWFpYWVtWV1lYWVtVVlhWV1lYWVtYWVtYWVtWV1lXWFlXWFpXWFpOTlBLTE5MTU9ERUdFRUdBQkNCQkRGR0lYWVtERUZYWVtYWVtYWVtYWVtYWVtYWVpYWVtPUFFQUFJQUVNRUlRYWVpYWVtYWVtQUVNRUlRSUlRPUFJQUVNRUlRSU1VRUlRRUlRQUFJQUVJYWVtXWFpYWVtYWVtXWFpYWVtNTlBOT1FQUVJQUVNXWFpQUVNYWVtYWVpYWVtWV1lXV1lXWFlXWFpYWVvMOjRS3TBsAAAA2XRSTlMAAAAAAAEBAgICAgICAwMDAwMDAwQEFhcXFxgYHiMjLi4vOjs8PD09PT4+QEBAQEBAQEJCRUVFR0hJSktLTU1OTk5OTk9PUFBQUlNUVVlhY2RkZWVmaHBxcXJzdHR0dXV2dnd3d3iGhoeHiYmKi4uMjI2NkZiZm5ycn6GhoqapqamrrKysra2tra2urq6ursDAwcHDw8TExMXFyMjJycrKysvM0NDQ0dXW1tfY2dna2tvb3N3e3+Pk5eXl5eXl5ufn5+jo6Ojp6uvr7e/v8PT19vb29vb3+Pv7OgJHLwAAAjhJREFUeNqNk+dXU0EQxVHX3jViC8aCgu67AQsWRMWKJdh7r0FAUSJBDUQUe7B3xIKxYqEYMfauKBoFFU00k7/FzfNBiMLR+2H27PnNzrlndiaA+clo9r//gTdsrh031+hO5uq6taoRByUVk6zipC5/4SZ6J7nKCt+8Kyx3kzOuoT/ufJZch1cNw6YMjFp+0EU5Harjjja6t1gCYNopgrTgPtna+3AbK10bx8ERlro1TBw8Jo+sLaqwnl6MANB9Wuanb5kzggFEPyV9JVY7XfM40P90gSE21lBwJgLgc3861QpOpuOiYD+HnM/qxjsGcEhHKfk3bmd3LZV4j0sJTFHi5RDOl7jtKhlrqCwSmPzYS/qGe+OjqRIiP5NGxlF0Ewjbs4axZns9nu0NGFu3Xwtcp6ECG1Oy6ZUpPa1UJ956hPowNqY0Ld30nLJTjAFms5XeWixZHyYxFu7FoYyNfZ9lsZTQBbNZLn4L0B5Yy1j9HR7PtnpK8RsUpVgrF9amyNZCe3rjk+kShnxRrKns7mWcB19JZIoSLvbifBHdVVW25RQHj3DE15H7uNoxiEM6Qet9TZ3DgYHniwwTJxiKzg0G+Gz3d7XvS15GAwiZufvj132zekuQRj6jOFaJW1opL4ZD+E/dohUHH3+VrG2rMAu00YOFEAmmXQJi/kO6HVh9mDrl0I8jK0ZjYwaGrzzk9h8moUZxTqKK/Ncl+RUkRrFp7YN8JymoxjVordEdy9V1bfz/S/SPFfwFzkjml7ihf2UAAAAASUVORK5CYII='), auto";

document.getElementById('JSE-captcha-game').innerHTML = '<table id="JSE-board"><tr><td id="JSE-board-0""></td><td id="JSE-board-1"></td><td id="JSE-board-2"></td></tr><tr><td id="JSE-board-3"></td><td id="JSE-board-4"></td><td id="JSE-board-5"></td></tr><tr><td id="JSE-board-6"></td><td id="JSE-board-7"></td><td id="JSE-board-8"></td></tr></table>';

var css = '#JSE-board { width: 100%; border-collapse: collapse; font-size: 32px; font-weight: bold; background: #FFF; }\
#JSE-board td { width: 96px; height: 54px; border: 3px solid #222; text-align: center;}\
#JSE-board td::after { content: ""; display: block; }\
#JSE-board td { border: 5px solid #adaa95; }\
#JSE-board td:first-of-type { border-left-color: transparent; border-top-color: transparent; }\
#JSE-board td:nth-of-type(2) { border-top-color: transparent; }\
#JSE-board td:nth-of-type(3) { border-right-color: transparent; border-top-color: transparent; }\
#JSE-board tr:nth-of-type(3) td { border-bottom-color: transparent; }\
#JSE-board td:hover { background: #FFFCF2; }\
.JSE-board-xo { display: inline-block; margin: 0px; padding: 0px; width: 50px; height: 50px; margin-top: 2px !important; }';
var s = document.createElement("style");
s.innerHTML = css;
document.getElementsByTagName("head")[0].appendChild(s);

function layoutBoard(positions) {
  for (var i = 0; i < positions.length; i++) {
    var char = positions[i];
    if (positions[i] === '*') char = ' ';
    var color = 'black';
    if (positions[i] === 'O') {
      color = 'red';
    }
    var square = document.getElementById('JSE-board-'+i);

    if (char === 'O') {
      square.innerHTML = '<img class="JSE-board-xo" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAAY1BMVEX///+yAACOAACyAACOAACyAACOAACyAACNAACyAACRAACMAACyAACMAACyAACLAACyAACKAACyAACKAACyAACIAACyAACQAACIAACyAACHAACyAACHAACFAACOAACvAACyAADz+WNJAAAAHXRSTlMAEBQgJzA6QExgbG9wgICQkKCgr8DM0Nja4Ofw9GTimP4AAAGWSURBVHja1ZXJkoMgEEBbY1xi4o5RgQn//5WxpsQGBoHiNu/+qldosHGruomKX+jUVTcI4vZchcH69LvFJKxMhTua1GyqI2ojnDRX4WbhYbYGvVPhhd7/epUIovJ609DsDGa3Pg8jTz2joVAGNFDF++G51heqjrtKQCOpVvQ4ywBR+9mhhmonvZ3FOj9agJWCHt5OeyaK3pzABcm8ewcy2cnlofnmEnJkgXkm4CBlp1kaAQtwUmJIvcIOPPRcrfJ5zi/xiekmxRcArLiGXmopbpgpdiaoPxlu9wABjFKsoTNaGtjYHocBQeBA6OFNYSI5RAZ6ieFFnmITJrb/UIxuTvQ4ohcgeuWilzz6WcU+5OivI/qziv4e4z/k8BOQLnpArcrPO/V7eHSgwbvJyov6GHqteljxbvapJVzPkUU/5Xg3tzo1tHpDTT/lcEdvh42lkuTIuEoOGpX0JGRsd0bCDWowePAQ0ENy5tdYDhayxectmeMLc9DCJRm51kgGLkpyoZXgI3ttprW9MJrbrXvCjj6SvrZaXzhYmK427WTDAAAAAElFTkSuQmCC" alt="O" />';
    } else if (char === 'X') {
      square.innerHTML = '<img class="JSE-board-xo" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAA4CAMAAACfWMssAAAATlBMVEX///8zMzNEREQzMzMzMzNFRUUzMzMzMzNGRkZGRkZHR0czMzMzMzMzMzMzMzNMTEwzMzNNTU1OTk4zMzNQUFBRUVFTU1MzMzNISEhVVVXsGgvzAAAAF3RSTlMAEB8gMDxAUFdwh6CwwNDc4Ofv8Pb7/sYyFL0AAAD/SURBVHjapdS7ksJADERRYd7Ya2NsPMz//yhokwnuVnUXeyMpOJlK8Y8u81bXW5idx7IMh1+31WzyXF+yJeUzWZPaZfeIa62QwmWnhJDSJTxWSu3KPmKm1G747N0KKd24C0jXUfqOUjshpaPUTks6LbWjFE5KOi19R0nnSTpX2i7lo7Zezf3Aoekv2QtECWdLOFvC2bI5Xf/CDbl/HtJ0kKaDNN03cjekoZw74cbS6qfaWjvfRUCaDtJ0lL6j1E5I6Si105JOS+0ohZOSTkvfUdLZcqDTco7Yw1nyGCc4S14TwkmZMO50Wj4/82GBk3K7RMphKeM5zG5r3eZ03/YGGgttDz/JfhgAAAAASUVORK5CYII=" alt="O" />';
    } else {
      square.innerHTML = '';
    }
    //square.innerHTML = char;
    square.style.color = color;
    if (positions[i] === '*') {
      square.onclick = function() {
        correct += 1;
        self.mlData.mouseClicks += 1;
        if (correct >= 3) {
          self.gameCompleted();
        } else {
          loadNewGame();
        }
      }
    }
  }
}

var handleMovement = function(e) {
  var rect = e.currentTarget.getBoundingClientRect();
  if (e.pageX == null) {
    eDoc = (e.target && e.target.ownerDocument) || document;
    doc = eDoc.documentElement;
    body = eDoc.body;
    e.pageX = Math.floor((e.touches && e.touches[0].clientX || e.clientX || 0) +
      (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
      (doc && doc.clientLeft || body && body.clientLeft || 0));
    e.pageY = Math.floor((e.touches && e.touches[0].clientY || e.clientY || 0) +
      (doc && doc.scrollTop || body && body.scrollTop || 0) -
      (doc && doc.clientTop || body && body.clientTop || 0));
  }
  var mouseX = e.pageX - rect.left;
  var mouseY = e.pageY - rect.top;

  self.mlData.mouseEvents += 1;
  if (mouseY < self.mlData.mouseY) self.mlData.mouseDown += 1;
  if (mouseY > self.mlData.mouseY) self.mlData.mouseUp += 1;
  if (mouseX > self.mlData.mouseX) self.mlData.mouseRight += 1;
  if (mouseX < self.mlData.mouseX) self.mlData.mouseLeft += 1;
  self.mlData.mouseX = mouseX;
  self.mlData.mouseY = mouseY;
  self.mlData.mousePattern.push(parseInt(mouseX)+'x'+parseInt(mouseY));
}
document.getElementById('JSE-captcha-game').onmousemove = handleMovement;
document.getElementById('JSE-captcha-game').ontouchmove = handleMovement;

function loadNewGame() {
  var games = [
    [' ',' ','X','O','*','O','X',' ',' '],
    ['X','X','*',' ','O',' ','O',' ',' '],
    ['X','*','X',' ','O',' ',' ','O',' '],
    [' ',' ','O','X','*','X','O',' ',' '],
    ['X','O',' ',' ','*',' ',' ','O','X'],
    ['*',' ',' ','X','O',' ','X',' ','O'],
    ['X',' ',' ','*','O','O','X',' ',' '],
    [' ','O',' ',' ','O',' ','X','*','X'],
    [' ',' ','O',' ','O',' ','*','X','X']
  ];
  var selectedGame = games[Math.floor(Math.random()*games.length)];
  layoutBoard(selectedGame);
}

loadNewGame();