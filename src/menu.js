/**
 * A simple menu for the Simple360Player
 */
;(function (global) {
    'use strict';

    var template = "\<div>\
            <div class='simple-360-controls'>\
                <div role='button' class='simple-360-control simple-360-play menuicon menuicon-play'></div>\
                <div class='simple-360-control simple-360-time'></div>\
                <div role='button' class='simple-360-control simple-360-full menuicon menuicon-maximize'></div>\
                <div class='simple-360-progress'>\
                    <input type='range' value='0' class='simple-360-progress-input'/>\
                </div>\
            </div>\
        </div>",

        formatTime = function (secs) {
            //NaN check
            if (secs !== secs) {
                return '0:00';
            }
            var h = Math.floor(secs / 3600);
            if (h) {
                secs = secs % 3600;
            }
            var m = Math.floor(secs / 60);
            var s = Math.floor(secs - (m * 60)) < 10 ? '0' + Math.floor(secs - (m * 60)) : Math.floor(secs - (m * 60));
            if (h) {
                return h + ':' + (m < 10 ? '0' + m : m) + ':' + s;
            }
            return m + ':' + s;
        },

        getDims = function () {
            var w = window,
                d = document,
                e = d.documentElement,
                g = d.getElementsByTagName('body')[0],
                x = w.innerWidth || e.clientWidth || g.clientWidth,
                y = w.innerHeight|| e.clientHeight|| g.clientHeight;
            return { w: x, h: y };
        };

    function htmlToElements(html) {
        var template = document.createElement('template');
        template.innerHTML = html;
        return template.content.childNodes;
    }

    function Menu(player) {
        var _this = this;

        this.container = player.container;
        this.container.appendChild(htmlToElements(template)[0]);
        this.container.className += " minscreen";
        this.video = player.el;
        this.canvas = player.canvas;
        this.player = player;

        this.initializedCanvasWidth = this.canvas.width;
        this.initializedCanvasHeight = this.canvas.height;

        this._playPause = document.getElementsByClassName('simple-360-play')[0];
        this._progressSlider = document.getElementsByClassName('simple-360-progress-input')[0];
        this._minMaxScreen = document.getElementsByClassName('simple-360-full')[0];
        this._time = document.getElementsByClassName('simple-360-time')[0];


        /**
         * Add event listeners
         */

        function showPlay(bPlay) {
            _this._playPause.className = _this._playPause.className.replace(
                bPlay? "menuicon-pause" : "menuicon-play",
                bPlay? "menuicon-play" : "menuicon-pause"
            );
        }
        this.video.addEventListener("playing", function () {
            showPlay(false);
        });
        this.video.addEventListener("pause", function () {
            showPlay(true);
        });
        this.video.addEventListener("ended", function () {
            showPlay(true);
        });

        this._playPause.addEventListener("click", function () {
            if (_this.video.paused) {
                _this.video.play();
            } else {
                _this.video.pause();
            }
        });

        this.isFullscreen = false;
        this._minMaxScreen.addEventListener("click", function() {
            if (!_this.isFullscreen) {
                if (_this.canvas.requestFullscreen) {
                    _this.canvas.requestFullscreen();
                } else if (_this.canvas.mozRequestFullScreen) {
                    _this.canvas.mozRequestFullScreen(); // Firefox
                } else if (_this.canvas.webkitRequestFullscreen) {
                    _this.canvas.webkitRequestFullscreen(); // Chrome and Safari
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                }
            }
        });

        function resize() {
            var dims = getDims(),
                width = _this.isFullscreen ? dims.w : _this.initializedCanvasWidth,
                height = _this.isFullscreen ? dims.h : _this.initializedCanvasHeight,
                orientation = player.getScreenOrientation(),
                temp;

            //is landscape
            if (orientation === 90 || orientation === -90) {
                temp = width;
                width = height;
                height = temp;
            }

            _this.canvas.width = width;
            _this.canvas.height = height;
        }

        function onFschange() {
            var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;
            if (!fullscreenElement) {
                _this.isFullscreen = false;
                _this.container.className = _this.container.className.replace("fullscreen", "minscreen");
            } else {
                _this.isFullscreen = true;
                _this.container.className = _this.container.className.replace("minscreen", "fullscreen");
            }
            resize();
        }

        document.addEventListener('mozfullscreenchange', onFschange);
        document.addEventListener('webkitfullscreenchange', onFschange);
        document.addEventListener('fullscreenchange', onFschange);

        window.addEventListener('orientationchange', resize);

        this._progressSlider.addEventListener("change", function() {
            var newTime = _this.video.duration * (_this._progressSlider.value / 100);
            _this.video.currentTime = newTime;
        });

        this.video.addEventListener("timeupdate", function () {
            var percent = _this.video.currentTime / _this.video.duration;
            _this._progressSlider.value = percent * 100;
            _this.updateTime();
        }, false);

        this.video.addEventListener("loadedmetadata", function () {
            _this.updateTime();
        }, false);
    }

    Menu.prototype.updateTime = function(time) {
        var duration = this.video.duration || 0,
            time = time || this.video.currentTime || 0;
        this._time.textContent = formatTime(time) + ' / ' + formatTime(duration);
    };

    Menu.prototype.update = function(player, delta) {

    };

    global.Menu = Menu;
}(window));
