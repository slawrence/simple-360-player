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

        function dragStart(e, p) {
            moving = true;
            lastX = p.pageX;
            lastY = p.pageY;
        }
        
        function dragMove(e, p) {
            if (!moving) return;
            e.preventDefault();
            var fudge = 0.003;
            var x = p.pageX, y = p.pageY;
            var xDelta = lastX - x;
            var yDelta = lastY - y;
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
