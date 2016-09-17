(function (global) {
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

        this.update = quat.create(),

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

                rotate(xDelta * fudge, yDelta * fudge);
            }

        }, false);

        el.addEventListener('mouseup', function (e) {
            moving = false;
        }, false);

        el.addEventListener('mouseout', function (event) {
            moving = false;
        }, false);

        var currentX = 0;
        var currentY = 0;
        function rotate(xDelta, yDelta) {
            if (xDelta || yDelta) {
                currentX = currentX + xDelta;
                currentY = currentY + yDelta;

                currentY = clamp(currentY, -Math.PI/2, Math.PI/2);
                _this.update = quat.create();

                quat.rotateX(_this.update, _this.update, currentY);
                quat.rotateY(_this.update, _this.update, currentX);
                quat.normalize(_this.update, _this.update);

            }
        };

    }

    Controls.prototype.frame = function(player) {
        player.rotation = this.update;
    };

    global.Controls = Controls;
}(window));
