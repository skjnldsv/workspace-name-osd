/**
 * SPDX-FileCopyrightText: 2026 skjnldsv <skjnldsv@protonmail.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import Meta from 'gi://Meta';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

const FADE_MS = 200;
const VISIBLE_MS = 1500;
// extra room around the label when looking for top bar items it would cover
const OVERLAP_PADDING = 12;

export default class WorkspaceNameOsd extends Extension {
    enable() {
        // spans the top bar of the primary monitor; the label is centered in it
        this._container = new St.Bin({
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
            reactive: false,
            visible: false,
        });
        // popup-menu-content picks up the shell theme's background and colors
        this._label = new St.Label({
            style_class: 'popup-menu-content workspace-name-osd',
            opacity: 0,
        });
        this._container.set_child(this._label);
        // plain child of the UI group rather than chrome: it never takes input
        Main.layoutManager.uiGroup.add_child(this._container);

        // top bar items faded out while the label covers them
        this._covered = [];
        this._hideId = 0;
        global.workspace_manager.connectObject(
            'active-workspace-changed', () => this._show(), this);
    }

    disable() {
        global.workspace_manager.disconnectObject(this);
        this._clearHideTimeout();
        this._restoreCovered(0);
        this._container.destroy();
        this._container = null;
        this._label = null;
    }

    _show() {
        // the overview already shows every workspace
        if (Main.overview.visible)
            return;

        const index = global.workspace_manager.get_active_workspace_index();
        this._label.text = Meta.prefs_get_workspace_name(index);

        // the top bar is whatever sits above the work area
        const monitor = Main.layoutManager.primaryMonitor;
        const area = Main.layoutManager.getWorkAreaForMonitor(
            Main.layoutManager.primaryIndex);
        const barHeight = area.y - monitor.y;
        if (barHeight <= 0)
            return;
        this._container.set_position(monitor.x, monitor.y);
        this._container.set_size(monitor.width, barHeight);
        // panels may be rebuilt (e.g. by dash-to-panel) and end up above us
        Main.layoutManager.uiGroup.set_child_above_sibling(this._container, null);
        this._container.show();

        // a switch while already shown keeps the label and swaps the text;
        // the items under it are looked up again since the width changed
        this._label.remove_all_transitions();
        this._label.ease({
            opacity: 255,
            duration: FADE_MS,
            mode: Clutter.AnimationMode.EASE_OUT_QUAD,
        });
        this._fadeCovered(monitor, barHeight);

        this._clearHideTimeout();
        this._hideId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, VISIBLE_MS, () => {
            this._hideId = 0;
            this._hide();
            return GLib.SOURCE_REMOVE;
        });
    }

    _hide() {
        this._restoreCovered(FADE_MS);
        this._label.ease({
            opacity: 0,
            duration: FADE_MS,
            mode: Clutter.AnimationMode.EASE_IN_QUAD,
            onComplete: () => this._container.hide(),
        });
    }

    /** Fades out the top bar items the label would sit on top of. */
    _fadeCovered(monitor, barHeight) {
        const [, labelWidth] = this._label.get_preferred_width(-1);
        const left = monitor.x + (monitor.width - labelWidth) / 2 - OVERLAP_PADDING;
        const right = left + labelWidth + 2 * OVERLAP_PADDING;

        const covered = Object.values(Main.panel.statusArea)
            .map(item => item?.container)
            .filter(actor => actor?.mapped)
            .filter(actor => {
                const [x, y] = actor.get_transformed_position();
                const [w] = actor.get_transformed_size();
                return x < right && x + w > left &&
                    y >= monitor.y && y < monitor.y + barHeight;
            });

        // items no longer under the (possibly narrower) label come back
        this._restoreCovered(FADE_MS, covered);
        this._covered = covered;
        covered.forEach(actor => actor.ease({
            opacity: 0,
            duration: FADE_MS,
            mode: Clutter.AnimationMode.EASE_OUT_QUAD,
        }));
    }

    _restoreCovered(duration, keep = []) {
        this._covered
            .filter(actor => !keep.includes(actor))
            .forEach(actor => actor.ease({
                opacity: 255,
                duration,
                mode: Clutter.AnimationMode.EASE_OUT_QUAD,
            }));
        this._covered = this._covered.filter(actor => keep.includes(actor));
    }

    _clearHideTimeout() {
        if (this._hideId) {
            GLib.source_remove(this._hideId);
            this._hideId = 0;
        }
    }
}
