/**
 * @module JSECaptcha
 * @description Module for bot detection based on client-side data passed to a machine learning engine.
 * @note change line 8 captchaServer for testnet
 */
/* eslint-disable */

var JSECaptcha = (function () {
  var self = this;
  this.captchaServer = 'https://load.jsecoin.com';
  //this.captchaServer = 'http://localhost:81';
  this.container = document.getElementById('JSE-captcha-container');
  this.mlData = {
    loadTime: new Date().getTime(),
    tickTime: 0,
    finishTime: 0,
    mouseX: 0,
    mouseY: 0,
    mouseUp: 0,
    mouseDown: 0,
    mouseLeft: 0,
    mouseRight: 0,
    mouseClicks: 0,
    mouseEvents: 0,
    mousePattern: [],
    gamesCompleted: 0,
    checkBox: 0
  };
  this.JSECaptchaCompleted = false;
  mlData.url = window.location.href;
	mlData.userAgent = navigator.userAgent || 0;
	mlData.platform = navigator.platform || 0;
	mlData.referrer = document.referrer || 0;
	mlData.runOnce = window.JSERunOnce || false;
	mlData.language = window.navigator.language || 0;
	if (navigator.languages) { 
		mlData.languages = navigator.languages.join('') || 0;
	} else {
		mlData.languages = 1;
	}
	mlData.timezoneOffset = new Date().getTimezoneOffset() || 0;
	mlData.appName = window.navigator.appName || 0;
	mlData.screenWidth = window.screen.width || 0;
	mlData.screenHeight = window.screen.height || 0;
	mlData.screenDepth = window.screen.colorDepth || 0;
	mlData.screen = mlData.screenWidth+'x'+mlData.screenHeight+'x'+mlData.screenDepth; // 1920x1080x24
	mlData.innerWidth = window.innerWidth || 0;
	mlData.innerHeight = window.innerHeight || 0;
	mlData.deviceMemory = navigator.deviceMemory || navigator.hardwareConcurrency || 0;
	mlData.protoString = Object.keys(navigator.__proto__).join('').substring(0, 100) || 0;

	if (window.frameElement == null) {
		mlData.iFrame = false;
	} else {
		mlData.iFrame = true;
	}
  this.jseLogo = 'data:image/png;base64,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';

  var css = '  #JSE-captcha-reset { all: initial; }\
  #JSE-captcha-reset * { box-sizing: content-box !important; vertical-align: top !important; box-shadow: none; -moz-box-shadow: none; -webkit-box-shadow: none; border: none; padding: 0; margin: 0; }\
  #JSE-captcha-container { position: relative; background: #FFF; border: 1px solid #EEE; border-radius: 3px; width: 220px; height: 40px; font-size: 15px; font-family: Arial, sans-serif; color: #777; }\
  #JSE-captcha-check { position: absolute; top: 1px; left: 100px; opacity: 0; }\
  #JSE-captcha-tick { text-align: center; color: #1687e9; font-size: 17px; height: 20px; width: 20px; background: #FFF; border: 2px solid #CCC; border-radius: 2px; margin: 6px 0px 0px 8px; cursor: pointer; padding-top: 3px !important; }\
  #JSE-captcha-text { position: absolute; top: 12px; left: 50px; font-weight: semi-bold; }\
  #JSE-captcha-logo { position: absolute; top: 5px; right: 10px; border-left: 1px solid #EEE; padding-left: 10px !important; }\
  #JSE-captcha-logo-image { height: 30px; }\
  #JSE-captcha-tick:hover { border: 2px solid #0F9CBE; }\
  #JSE-captcha-game-container { display: none; background: #000; border-radius: 3px; position: absolute; top: 50px; left: 5px; height: 190px; width: 290px; overflow: hidden; -webkit-touch-callout: none; -webkit-user-select: none; -khtml-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; }\
  #JSE-captcha-robot { height: 18px; -webkit-touch-callout: none; -webkit-user-select: none; -khtml-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; margin-left: 1px !important; }\
  #JSE-captcha-smiley { height: 18px; -webkit-touch-callout: none; -webkit-user-select: none; -khtml-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; margin-left: 2px !important; }\
  #JSE-captcha-game { position: relative; height: 100%; width: 100%; margin: 0; padding: 0; }\
  .JSE-captcha-dark #JSE-captcha-container { background: #222; border: 1px solid #000; color: #CCC; }\
  .JSE-captcha-dark #JSE-captcha-tick { background: #444; }\
  .JSE-captcha-large #JSE-captcha-container { width: 300px; height: 55px; font-size: 18px; }\
  .JSE-captcha-large #JSE-captcha-logo-image { height: 44px; }\
  .JSE-captcha-large #JSE-captcha-tick { height: 30px; width: 30px; margin: 9px 0px 0px 10px !important; }\
  .JSE-captcha-large #JSE-captcha-text { position: absolute; top: 18px; left: 60px; }\
  .JSE-captcha-large #JSE-captcha-robot { height: 22px; margin-top: 3px !important; }\
  .JSE-captcha-large #JSE-captcha-smiley { height: 22px; margin-top: 3px !important; }\
  .JSE-captcha-large #JSE-captcha-game-container { top: 60px; }\
  .JSE-captcha-shadow #JSE-captcha-container { box-shadow: 0px 3px 6px 0px rgba(0, 0, 0, 0.12); }';
  var s = document.createElement("style");
  s.innerHTML = css;
  document.getElementsByTagName("head")[0].appendChild(s);

  if (!document.getElementById('JSE-captcha')) {
    return false;
  }

  document.getElementById('JSE-captcha').innerHTML = '<div id="JSE-captcha-reset"><div id="JSE-captcha-container"><input id="JSE-captcha-check" type="checkbox" /><div id="JSE-captcha-tick"></div><div id="JSE-captcha-text">I\'m human</div><div id="JSE-captcha-logo"><a href="https://jsecoin.com" target="_blank"><img id="JSE-captcha-logo-image" src="'+this.jseLogo+'" alt="JSEcoin"></a></div><div id="JSE-captcha-game-container"><div id="JSE-captcha-game"></div></div></div></div>';

  this.tick = function() {
    var robotFace = 'data:image/png;base64,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';
    document.getElementById('JSE-captcha-tick').innerHTML = '<img id="JSE-captcha-robot" draggable="false" src="'+robotFace+'" />';
    this.mlData.tickTime = new Date().getTime();
    this.submitMLData(function(res) {
      var JSECaptchaPass = document.createEvent('Event');
      JSECaptchaPass.initEvent('JSECaptchaPass', true, true);
      JSECaptchaPass.ip = res.ip;
      JSECaptchaPass.rating = res.rating;
      JSECaptchaPass.pass = res.pass;
      document.dispatchEvent(JSECaptchaPass);
      self.JSECaptchaCompleted = true;
      this.shrink();
    }, function(res) {
      this.grow();
    });
  };

  this.tickOnce = false;

  document.getElementById('JSE-captcha-tick').onmousedown = function(e) {
    if (!self.tickOnce) {
      self.tickOnce = true;
      self.tick();
    }
  }

  document.getElementById('JSE-captcha-check').onchange = function(e) {
    self.mlData.checkBox = 1;
  }

  this.grow = function() {
    var allDone = true;
    var captchaContainer = document.getElementById('JSE-captcha-container');
    document.getElementById('JSE-captcha-game-container').style.display = 'none';
    if (captchaContainer.offsetHeight < 250) {
      captchaContainer.style.height = Math.min(captchaContainer.offsetHeight+4,250)+"px";
    }
    if (captchaContainer.offsetWidth < 300) {
      captchaContainer.style.width = Math.min(captchaContainer.offsetWidth+2,300)+"px";
    }
    if (captchaContainer.offsetHeight < 250 || captchaContainer.offsetWidth < 300) {
      allDone = false;
    }

    if (!allDone) {
      setTimeout(function(mySelf) { mySelf.grow(); }, 5,this);
    } else {
      document.getElementById('JSE-captcha-text').innerHTML = 'I\'m not a robot...';
      document.getElementById('JSE-captcha-game-container').style.display = 'block';
      document.getElementById('JSE-captcha-tick').onmousedown = function() { return false; };
      this.loadRandomGame();
    }
  };

  this.shrink = function() {
    var miniShrink = function() {
      var allDone = true;
      var maxWidth = 220;
      var maxHeight = 40;
      var maxText = 64;
      var maxTick = 44;
      if (document.querySelector('.JSE-captcha-large') !== null) {
        maxWidth = 300;
        maxHeight = 55;
        maxText = 80;
        maxTick = 60;
      };
      if (!document.getElementById('JSE-captcha-container')) {
        return false;
      }
      var captchaContainer = document.getElementById('JSE-captcha-container');
      if (captchaContainer.offsetHeight > 40) {
        captchaContainer.style.height = Math.max(captchaContainer.offsetHeight-10,maxHeight)+"px";
      }
      if (captchaContainer.offsetWidth > maxWidth) {
        captchaContainer.style.width = Math.max(captchaContainer.offsetWidth-5,maxWidth)+"px";
      }
      var opacity = parseFloat(window.getComputedStyle(document.getElementById('JSE-captcha-game-container')).getPropertyValue("opacity"));
      if (opacity > 0.1) {
        document.getElementById('JSE-captcha-game-container').style.opacity = opacity - 0.1;
      } else {
        document.getElementById('JSE-captcha-game-container').style.display = 'none';
      }
      if (captchaContainer.offsetHeight > maxHeight+2 || captchaContainer.offsetWidth > maxWidth+2) {
        allDone = false;
      }

      if (!allDone) {
        setTimeout(function(shrink2) { shrink2(); }, 5, miniShrink);
      } else {
        document.getElementById('JSE-captcha-text').innerHTML = 'Verified Human';
        document.getElementById('JSE-captcha-text').style.left = maxText+'px';
        document.getElementById('JSE-captcha-tick').style.width = maxTick+'px';
        var wink = 'data:image/png;base64,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';
        document.getElementById('JSE-captcha-tick').innerHTML = '<img id="JSE-captcha-smiley" draggable="false" src="'+wink+'" />';
        document.getElementById('JSE-captcha-tick').onmousedown = function() { return false; };
      }
    }
    miniShrink();
  };

  this.submitMLData = function(passCallback,failCallback) {
    var xhr = new XMLHttpRequest();
    xhr.overrideMimeType("application/json");
    xhr.open("POST", this.captchaServer+'/captcha/request/', true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        //console.log('Sent ML Data and got 200 response');
        //console.log(xhr.responseText);
        var res = JSON.parse(xhr.responseText);
        if (res.pass && res.pass === true) {
          passCallback(res);
        } else {
          failCallback(res);
        }
      }
    };
    var cleanDataString = this.prepMLData();
    xhr.send(cleanDataString);
  };

  this.prepMLData = function() {
    var cleanData = this.mlData;
    cleanData.mousePattern = cleanData.mousePattern.slice(cleanData.mousePattern.length-200,cleanData.mousePattern.length);
    return JSON.stringify({"mlData": cleanData});
  };

  this.gameCompleted = function() {
    this.mlData.finishTime = new Date().getTime();
    this.mlData.gamesCompleted += 1;
    this.submitMLData(function(res) {
      var JSECaptchaPass = document.createEvent('Event');
      JSECaptchaPass.initEvent('JSECaptchaPass', true, true);
      JSECaptchaPass.ip = res.ip;
      JSECaptchaPass.rating = res.rating;
      JSECaptchaPass.pass = res.pass;
      document.dispatchEvent(JSECaptchaPass);
      self.JSECaptchaCompleted = true;
      this.shrink();
    }, function(res) {
      loadRandomGame();
    });
  };



  this.loadGame = function(gameFile,cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', this.captchaServer+'/captcha/load/'+gameFile);
    xhr.onload = function() {
      if (xhr.status === 200) {
        var gameCode = xhr.responseText;
        cb(gameCode);
      }
    };
    xhr.send();
  }

  this.loadRandomGame = function() {
    var games = ['asteroids.js','tictactoe.js','pilot.js'];
    //games = ['tictactoe.js'];
    var choosenGame = games[Math.floor(Math.random()*games.length)];
    loadGame(choosenGame,function(gameCode) {
      this.game = new Function(gameCode);
      this.game();
    });
  }

  // Exports
  window.JSECaptchaComplete = function(nextFuncName) {
    if (typeof self.JSECaptchaCompleted !== 'undefined' && self.JSECaptchaCompleted === true) {
      window[nextFuncName]();
    } else {
      for (var i = 0; i < 2000; i+=800) {
        setTimeout(function() {
          document.getElementById('JSE-captcha-container').style.borderColor = "#CCCCCC";
        },i);
        setTimeout(function() {
          document.getElementById('JSE-captcha-container').style.borderColor = "#CC0000";
        },i+400);
      }
    }
  };

});

JSECaptcha();
