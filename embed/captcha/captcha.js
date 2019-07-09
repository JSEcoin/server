/**
 * @module JSECaptcha
 * @description Module for bot detection based on client-side data passed to a machine learning engine.
 * @note change line 8 captchaServer for testnet
 */
JSECaptcha = (function() {
  var self = this;
  this.captchaServer = 'http://localhost:81'; // 'https://load.jsecoin.com';
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
    gamesCompleted: 0
  };
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
  this.jseLogo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADcAAABQCAMAAACK9B2WAAAC+lBMVEUAAAAWh+kWh+kWh+kVhekWh+kWh+kVhukxpe4Wh+kWh+kUhOggpO4Wh+kerPMQbuIYkuwWh+kan/AqtO0VhukWiuoVh+kWh+kfs/Uss+ogtvYot+8Zi+ger/Qusugks/EssOkhq/AakOkdqfMXj+sWiuousugZl+0Zm+4Ykuwose0gqfAitPMXj+susugPaOAUgecPa+EPauEfsfUusugdq/Mane8usuganO8YkewXkewVh+kXku0Wh+kkuvUYk+wwtegmse4QcOMsuO0ViOkSeeUesPQXkewusugamu4usugvtOghvPgco/EWi+oOaOAivvgusuggtvYSeuUPauEerfQXkOsXjususuggt/YerfQco/EusugusughtfQhvfgivvgYjuovsucRdOQfsvUanO4VhegcpfEVhekYk+wKaeQYlOwhu/cOaOEVhOggtfYbofAWiukdqfIZl+0hvPcus+ggtvYVhegfs/UhufcdqvMcpfERdOQVhukTfeYguPcamu4PaeEOaOAXj+sfs/UPaeASd+UXj+scpvEbnu8cpvIusugVhukOZuARdOQiwPkane8VhegRdOQOaeEntO8SeOUgu/gXj+servMivfgcpfEQbOEpufAOZuAbovAYkewQbuIUgegivvgOaeEanO8bnu8ZmO0fsfQfsPQVhugZmO0ivfgfsPQcpPEcovARceIiv/gYkesUgOYfsPQusugVhegUf+YRc+MPceQerPMWiukhufYjwvkgtPUco/AeqvIusugQb+IXjeoame4Zl+0bn+8xuOgdpvEOZt8YkesRcuMusugWh+kXjeoYk+wfsPQZl+0WiekgtfUbofAame4Zle0PaOAeq/MusugcpPEbn+8gtvYdqPIWi+oerfManO8YkesPa+ESeuUPbOEivfgfs/URc+MOZuAfsvUhufcQbuIguPYVhOgQcOIcpvEXj+sUgecSd+Qiv/ghu/cTfuYivPcane8XjusTfeYRdeQPauAiwfkhufYervQi+NvEAAAAzHRSTlMAwECAEKBwIALw4BINXx9GMzAoBrGVTtBFOikTB/v2LBcQCvr47OWhYWFYJBsX+/Tw7+vczsjFrKionpmRkFxWSEM7MRrw7uzp4N7Uy8vFxba2qKKg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';

  var css = '  #JSE-captcha-reset { all: initial; }\
  #JSE-captcha-container { position: relative; background: #F7F7F7; border: 1px solid #CCC; border-radius: 3px; width: 200px; height: 50px; font-size: 15px; font-family: Arial, sans-serif; }\
  #JSE-captcha-tick { text-align: center; color: #1687e9; font-size: 17px; line-height: 20px; vertical-align: middle; height: 20px; width: 20px; background: #FFF; border: 1px solid #CCC; border-radius: 2px; margin: 15px; cursor: pointer; }\
  #JSE-captcha-text { position: absolute; top: 16px; left: 50px; }\
  #JSE-captcha-logo { position: absolute; top: 5px; right: 10px; }\
  #JSE-captcha-logo-image { height: 40px; }\
  #JSE-captcha-tick:hover { border: 1px solid #888; }\
  #JSE-captcha-footer { font-size: 7px; color: #888; position: absolute; bottom: 2px; left: 50px; }\
  #JSE-captcha-game-container { display: none; background: #000; border-radius: 3px; position: absolute; top: 50px; left: 5px; height: 190px; width: 290px; overflow: hidden; }\
  #JSE-captcha-game { position: relative; height: 100%; width: 100%; margin: 0; padding: 0; }';
  var s = document.createElement("style");
  s.innerHTML = css;
  document.getElementsByTagName("head")[0].appendChild(s);

  document.getElementById('JSE-captcha').innerHTML = '<div id="JSE-captcha-reset"><div id="JSE-captcha-container"><div id="JSE-captcha-tick"></div><div id="JSE-captcha-text">I\'m Human</div><div id="JSE-captcha-logo"><a href="https://jsecoin.com" target="_blank"><img id="JSE-captcha-logo-image" src="'+this.jseLogo+'" alt="JSEcoin"></a></div><div id="JSE-captcha-game-container"><div id="JSE-captcha-game"></div></div><div id="JSE-captcha-footer">JSECOIN CAPTCHA &copy;</div></div></div>';

  this.tick = function() {
    document.getElementById('JSE-captcha-tick').innerHTML = '<span style="font-weight: bold; width: 100%; text-align: center; vertical-align: middle;">?</span>';
    this.mlData.tickTime = new Date().getTime();
    this.submitMLData(function(res) {
      var JSECaptchaPass = document.createEvent('Event');
      JSECaptchaPass.initEvent('JSECaptchaPass', true, true);
      JSECaptchaPass.ip = res.ip;
      JSECaptchaPass.rating = res.rating;
      JSECaptchaPass.pass = res.pass;
      document.dispatchEvent(JSECaptchaPass);
      window.JSECaptchaCompleted = true;
      this.shrink();
    }, function(res) {
      this.grow();
    });
  };

  document.getElementById('JSE-captcha-tick').onmousedown = function(e) {
    self.tick();
  }

  this.grow = function() {
    var allDone = true;
    var captchaContainer = document.getElementById('JSE-captcha-container');
    document.getElementById('JSE-captcha-game-container').style.display = 'none';
    document.getElementById('JSE-captcha-footer').style.display = 'none';
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
      document.getElementById('JSE-captcha-game-container').style.display = 'block';
      document.getElementById('JSE-captcha-text').innerHTML = 'Complete Game';
      this.loadRandomGame();
    }
  };

  this.shrink = function() {
    var miniShrink = function() {
      var allDone = true;
      var captchaContainer = document.getElementById('JSE-captcha-container');
      if (captchaContainer.offsetHeight > 50) {
        captchaContainer.style.height = Math.max(captchaContainer.offsetHeight-10,50)+"px";
      }
      if (captchaContainer.offsetWidth > 200) {
        captchaContainer.style.width = Math.max(captchaContainer.offsetWidth-5,200)+"px";
      }
      var opacity = parseFloat(window.getComputedStyle(document.getElementById('JSE-captcha-game-container')).getPropertyValue("opacity"));
      if (opacity > 0.1) {
        document.getElementById('JSE-captcha-game-container').style.opacity = opacity - 0.1;
      } else {
        document.getElementById('JSE-captcha-game-container').style.display = 'none';
      }
      if (captchaContainer.offsetHeight > 52 || captchaContainer.offsetWidth > 202) {
        allDone = false;
      }

      if (!allDone) {
        setTimeout(function(shrink2) { shrink2(); }, 5, miniShrink);
      } else {
        document.getElementById('JSE-captcha-text').innerHTML = 'Thank You!';
        document.getElementById('JSE-captcha-tick').innerHTML = '&#10004;';
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
        console.log('Sent ML Data and got 200 response');
        console.log(xhr.responseText);
        var res = JSON.parse(xhr.responseText);
        if (res.pass && res.pass === true) {
          passCallback(res);
        } else {
          failCallback(res);
        }
      }
    };
    var data = JSON.stringify({"mlData": this.mlData});
    xhr.send(data);
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
      window.JSECaptchaCompleted = true;
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
    var games = ['asteroids.js','football.js','tictactoe.js'];
    
    var choosenGame = games[Math.floor(Math.random()*games.length)];
    loadGame(choosenGame,function(gameCode) {
      this.game = new Function(gameCode);
      this.game();
    });
  }
})();

// Exports

JSECaptchaComplete = function(nextFuncName) {
  if (typeof window.JSECaptchaCompleted !== 'undefined' && window.JSECaptchaCompleted === true) {
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

