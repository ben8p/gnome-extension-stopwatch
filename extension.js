const St = imports.gi.St;
const Main = imports.ui.main;
const Lang = imports.lang;
const PanelMenu = imports.ui.panelMenu;
const Tweener = imports.ui.tweener;
const Mainloop = imports.mainloop;

const Stopwatch = new Lang.Class({
    Name: 'Stopwatch',
    Extends: PanelMenu.Button,

    _init: function () {
        this.parent(0.0, 'Stopwatch', false);
        
        this._timeout = null;
        this._startTime = null;
        this._elapsedTime = new Date(0);
    
        this._layout = new St.BoxLayout();
        this.actor.add_actor(this._layout);

        this._startStopButton = new St.Button({
            style_class: 'system-status-button',
            reactive: true
        });
        this._startIcon = new St.Icon({
            icon_name: 'media-playback-start-symbolic',
            style_class: 'system-status-icon'
        });
        this._stopIcon = new St.Icon({
            icon_name: 'media-playback-stop-symbolic',
            style_class: 'system-status-icon'
        });
        this._startStopButton.set_child(this._startIcon);
        this._startStopButtonConnection = this._startStopButton.connect('button-press-event', Lang.bind(this, this._onButtonPress));
        this._layout.add(this._wrapIntoBin(this._startStopButton));

        this._label = new St.Label({
            text: '0:00:00',
            style_class: 'system-status-label'
        });
        this._layout.add(this._wrapIntoBin(this._label));
    },

    _wrapIntoBin: function(child) {
        const bin = new St.Bin({
            style_class: 'system-status-bin'
        });
        bin.set_child(child);
        return bin;
      },

    _onButtonPress: function() {
        if(!this._timeout) {
            this._startTime = new Date();
            this._elapsedTime = new Date(0);
            this._notifyOSD('stopwatch: start');
            this._startStopButton.set_child(this._stopIcon);
            this._refresh();
            this._timeout = Mainloop.timeout_add_seconds(1, Lang.bind(this, this._refresh));
        } else {
            this._notifyOSD('stopwatch: stop');
            this._startStopButton.set_child(this._startIcon);
            Mainloop.source_remove(this._timeout);
            this._timeout = null;
        }
    },

    _refresh: function() {
        const renderTime = new Date((new Date()).getTime() - this._startTime.getTime() + this._elapsedTime.getTime());
        const text = ~~(renderTime.getTime() / 3600000) + ':' + renderTime.toLocaleFormat('%M:%S');
        this._label.set_text( text );
        return true;
      },

    _notifyOSD: function(value) {
        const monitor = Main.layoutManager.primaryMonitor;

        if(!this.osdText) {
            this.osdText = new St.Label({style_class: 'stopwatch-osd-label', text: ''});
            Main.uiGroup.add_actor(this.osdText);
        }

        this.osdText.set_text(value);
        this.osdText.opacity = 255;
        this.osdText.set_position(
            monitor.x + Math.floor(monitor.width / 2 - this.osdText.width / 2),
            monitor.y + Math.floor(monitor.height / 2 - this.osdText.height / 2)
        );

        Tweener.addTween(this.osdText, {
            opacity: 0,
            time: 3,
            transition: 'easeOutQuad',
            onComplete: Lang.bind(this, this._hideOSD)
        });
    },

    _hideOSD: function() {
        Main.uiGroup.remove_actor(this.osdText);
        this.osdText = null;
    },

    destruct: function() {
        if(this._startStopButtonConnection) {
            this._startStopButton.disconnect(this._startStopButtonConnection);
        }
        if(this.timeout) {
            Mainloop.source_remove(this._timeout);
        }
    }
});

let stopwatch;

function init() {
}

function enable() {
    stopwatch = new Stopwatch();
    Main.panel.addToStatusArea('stopwatch', stopwatch);
}

function disable() {
    stopwatch.destroy();
}
