/**
 * A simple plugin for the Simple360Video Player... plugins are passed in the
 * player object on contruction when plugin is added and each frame the update
 * function is called which is required to be implemented.
 */
(function (global) {
    'use strict';

    function clamp(val, min, max) {
        if (val < min) {
            return min;
        }
        if (val > max) {
            return max;
        }
        return val;
    }

    function Controls(player) {
        var _this = this,
            el = player.canvas,
            lastX = 0,
            lastY = 0,
            moving = false;

        this.currentX = 0;
        this.currentY = 0;

        this.rotateSpeed = 0.05,
        this.leftKeys = [37]; //left arrow
        this.upKeys = [38]; //up arrow
        this.rightKeys = [39]; //right arrow
        this.downKeys = [40]; //down arrow
        this._pressedKeys = new Array(128);
        this.updateQuat = quat.create(),

        window.addEventListener("keydown", function (event) {
            _this._pressedKeys[event.keyCode] = true;
        }, false);

        window.addEventListener("keyup", function (event) {
            _this._pressedKeys[event.keyCode] = false;
        }, false);


        el.addEventListener('mousedown', function(e) {
            if (e.which === 1) {
                moving = true;
            }
            lastX = e.pageX;
            lastY = e.pageY;
        }, false);

        el.addEventListener('mousemove', function (event) {
            var xDelta, yDelta, fudge = 0.003;

            if (moving) {
                xDelta = event.pageX - lastX;
                yDelta = event.pageY - lastY;

                lastX = event.pageX;
                lastY = event.pageY;

                _this.rotate(xDelta * fudge, yDelta * fudge);
            }

        }, false);

        el.addEventListener('mouseup', function (e) {
            moving = false;
        }, false);

        el.addEventListener('mouseout', function (event) {
            moving = false;
        }, false);

    }

    Controls.prototype.rotate = function (xDelta, yDelta) {
        if (xDelta || yDelta) {
            this.currentX = this.currentX + xDelta;
            this.currentY = this.currentY + yDelta;

            this.currentY = clamp(this.currentY, -Math.PI/2, Math.PI/2);
            this.updateQuat = quat.create();

            quat.rotateX(this.updateQuat, this.updateQuat, this.currentY);
            quat.rotateY(this.updateQuat, this.updateQuat, this.currentX);
            quat.normalize(this.updateQuat, this.updateQuat);

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

        //Mouse rotation
        player.rotation = this.updateQuat;

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
    };

    global.Controls = Controls;
}(window));
