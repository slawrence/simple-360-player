/**
 * A simple menu for the Simple360Player
 */
(function (global) {
    'use strict';

    var template = "\<div>\
            <div class='simple-360-controls'>\
                <div class='simple-360-control simple-360-play menuicon menuicon-play'></div>\
                <div class='simple-360-control simple-360-time'></div>\
                <div class='simple-360-volume-container'>\
                    <div class='simple-360-control simple-360-volume menuicon menuicon-volume'></div>\
                    <div class='simple-360-volume-slider'></div>\
                </div>\
                <div class='simple-360-control simple-360-full menuicon menuicon-maximize'></div>\
                <div class='simple-360-progress'></div>\
            </div>\
        </div>";

    function htmlToElements(html) {
        var template = document.createElement('template');
        template.innerHTML = html;
        return template.content.childNodes;
    }

    function Menu(player) {
        this.container = player.container;
        this.container.appendChild(htmlToElements(template)[0]);

    }

    Menu.prototype.update = function(player, delta) {

    };

    global.Menu = Menu;
}(window));
