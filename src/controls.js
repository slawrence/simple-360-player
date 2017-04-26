/**
 * A simple plugin for the Simple360Video Player... plugins are passed in the
 * player object on contruction when plugin is added and each frame the update
 * function is called which is required to be implemented.
 */
;(function (global) {
    'use strict';

    var playerRef;

    function clamp(val, min, max) {
        if (val < min) {
            return min;
        }
        if (val > max) {
            return max;
        }
        return val;
    }

    function Mobile() {
        this.alpha = null;
        this.gamma = null;
        this.beta = null;

        window.addEventListener('deviceorientation', function(orientation) {
            this.alpha = orientation.alpha;
            this.gamma = orientation.gamma;
            this.beta = orientation.beta;
        }.bind(this));
    }

    Mobile.prototype.orientationIsAvailable = function() {
        return this.alpha !== null;
    }

    Mobile.prototype.rotationQuat = function() {
        if (!this.orientationIsAvailable()) {
            return quat.create(1, 0, 0, 0);
        }

        var degtorad = Math.PI / 180; // Degree-to-Radian conversion
        var z = this.alpha * degtorad / 2;
        var x = this.beta * degtorad / 2;
        var y = this.gamma * degtorad / 2;

        var cX = Math.cos(x);
        var cY = Math.cos(y);
        var cZ = Math.cos(z);
        var sX = Math.sin(x);
        var sY = Math.sin(y);
        var sZ = Math.sin(z);

        // ZXY quaternion construction.
        var w = cX * cY * cZ - sX * sY * sZ;
        var x = sX * cY * cZ - cX * sY * sZ;
        var y = cX * sY * cZ + sX * cY * sZ;
        var z = cX * cY * sZ + sX * sY * cZ;

        var deviceQuaternion = quat.fromValues(x, y, z, w);

        // Correct for the screen orientation.
        var screenOrientation = (playerRef.getScreenOrientation() * degtorad)/2;
        var screenTransform = [0, 0, -Math.sin(screenOrientation), Math.cos(screenOrientation)];

        var deviceRotation = quat.create();
        //var deviceRotation = quat.fromValues( 0, Math.sqrt( 0.5 ),0, 0);
        //quat.multiply(deviceQuaternion, deviceQuaternion, deviceRotation);
        quat.multiply(deviceRotation, deviceQuaternion, screenTransform);

        // deviceRotation is the quaternion encoding of the transformation
        // from camera coordinates to world coordinates.  The problem is that
        // our shader uses conventional OpenGL coordinates
        // (+x = right, +y = up, +z = backward), but the DeviceOrientation
        // spec uses different coordinates (+x = East, +y = North, +z = up).
        // To fix the mismatch, we need to fix this.  We'll arbitrarily choose
        // North to correspond to -z (the default camera direction).
        var r22 = Math.sqrt(0.5);
        quat.multiply(deviceRotation, quat.fromValues(r22, 0, 0, -r22), deviceRotation);
        quat.invert(deviceRotation, deviceRotation);

        return deviceRotation;
    }

    function Controls(player, opts) {
        var _this = this,
            el = player.canvas,
            lastX = 0,
            lastY = 0,
            moving = false,
            mouseDn = false;

        playerRef = player;

        this.opts = opts;

        this.mobile = new Mobile();

        this.currentX = 0;
        this.currentY = 0;

        this.mouseon = false;
        this.mouseoverDeltaX = 0;
        this.mouseoverDeltaY = 0;

        this.rotateSpeed = 0.05,
        this.leftKeys = [37]; //left arrow
        this.upKeys = [38]; //up arrow
        this.rightKeys = [39]; //right arrow
        this.downKeys = [40]; //down arrow
        this._pressedKeys = new Array(128);

        this.manualQuat = quat.create();

        window.addEventListener("keydown", function (event) {
            _this._pressedKeys[event.keyCode] = true;
        }, false);

        window.addEventListener("keyup", function (event) {
            _this._pressedKeys[event.keyCode] = false;
        }, false);


        el.addEventListener('mousedown', function(e) {
            if (e.which === 1) {
                mouseDn = true;
                dragStart(e, e);
            }
        }, false);

        el.addEventListener('mousemove', function (e) {
            dragMove(e, e);
        }, false);

        document.addEventListener('mousemove', function (e) {
            if (!mouseDn) return;
            e.preventDefault();
        }, false);

        el.addEventListener('mouseup', function (e) {
            mouseDn = false;
            dragEnd();
        }, false);

        el.addEventListener('mouseout', dragEnd, false);

        if (this.opts.touch) {
            el.addEventListener('touchstart', function (e) {
                dragStart(e, e.targetTouches.item(0));
            }, false);

            el.addEventListener('touchmove', function (e) {
                dragMove(e, e.targetTouches.item(0));
            }, false);

            document.addEventListener('touchmove', function (e) {
                if (!moving) return;
                e.preventDefault();
            }, false);

            el.addEventListener('touchend', dragEnd, false);
        }

        if (this.opts.mouseover) {

            el.addEventListener('mouseover', function () {
                _this.mouseon = true;
            });

            el.addEventListener('mouseleave', function () {
                _this.mouseon = false;
            });

            el.addEventListener('mousemove', function (e) {
                if (_this.mouseon) {
                    var rect = el.getBoundingClientRect();
                    var middlex = rect.width/2;
                    var middley = rect.height/2;
                    var mousex = e.clientX - rect.left;
                    var mousey = e.clientY - rect.top;

                    _this.mouseoverDeltaX = (mousex-middlex)/middlex * 0.005;
                    _this.mouseoverDeltaY = (mousey-middley)/middley * 0.005;
                }
            }, false);
        }

        function dragStart(e, p) {
            moving = true;
            lastX = p.pageX;
            lastY = p.pageY;
        }

        function dragMove(e, p) {
            var fudge = 0.003,
                x = p.pageX,
                y = p.pageY,
                xDelta = 0,
                yDelta = 0;

            if (!moving) {
                return;
            }
            e.preventDefault();

            xDelta = lastX - x;
            if (!_this.mobile.orientationIsAvailable()) {
                yDelta = lastY - y;
            }
            lastX = x;
            lastY = y;
            _this.rotate(xDelta * fudge, yDelta * fudge);
        }
 
        function dragEnd() {
            moving = false;
        }

    }

    Controls.prototype.rotate = function (xDelta, yDelta) {
        if (xDelta || yDelta) {
            this.currentX = this.currentX + xDelta;
            this.currentY = this.currentY + yDelta;

            this.currentY = clamp(this.currentY, -Math.PI/2, Math.PI/2);
            this.manualQuat = quat.create();

            quat.rotateX(this.manualQuat, this.manualQuat, this.currentY);
            quat.rotateY(this.manualQuat, this.manualQuat, this.currentX);
            quat.normalize(this.manualQuat, this.manualQuat);

        }
    };

    Controls.prototype.isPressed = function (keys) {
        var i;
        for (i = 0; i < keys.length; i += 1) {
            if (this._pressedKeys[keys[i]]) {
                return true;
            }
        }
        return false;
    };

    Controls.prototype.update = function(player, delta) {

        // Multiply manual, VR and mobile quats together to get overall rotation
        var rotation = quat.create();
        quat.multiply(rotation, this.mobile.rotationQuat(), this.manualQuat);
        quat.normalize(rotation, rotation);
        player.rotation = rotation;

        //Keyboard
        if (this.isPressed(this.upKeys)) {
            this.rotate(0, -this.rotateSpeed);
        }
        if (this.isPressed(this.downKeys)) {
            this.rotate(0, this.rotateSpeed);
        }
        if (this.isPressed(this.leftKeys)) {
            this.rotate(-this.rotateSpeed, 0);
        }
        if (this.isPressed(this.rightKeys)) {
            this.rotate(this.rotateSpeed, 0);
        }

        if (this.opts.mouseover && this.mouseon) {
            this.rotate(this.mouseoverDeltaX, this.mouseoverDeltaY);
        } else {
            this.mouseoverDeltaX = 0;
            this.mouseoverDeltaY = 0;
        }
    };

    global.Controls = Controls;
}(window));
