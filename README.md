<!--
  - SPDX-FileCopyrightText: 2026 skjnldsv <skjnldsv@protonmail.com>
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
# Workspace Name OSD

A tiny GNOME Shell extension that shows the name of the workspace you just
switched to, in the middle of the top bar.

- The name fades in over the top bar, stays for 1.5s and fades out.
- Top bar items it would cover (e.g. a centered clock or system monitor)
  fade out while it is shown, and come back afterwards.
- Switching again while it is shown only swaps the text.
- Colors come from your shell theme's popup menus.
- Nothing is shown while the overview is open.

No settings. Workspace names are the regular GNOME ones:

```sh
gsettings set org.gnome.desktop.wm.preferences workspace-names \
    "['Web', 'Code', 'Chat']"
```

Workspaces without a name show GNOME's default `Workspace N`.

## Install

```sh
git clone https://github.com/skjnldsv/workspace-name-osd.git \
    ~/.local/share/gnome-shell/extensions/workspace-name-osd@skjnldsv.github.io
gnome-extensions enable workspace-name-osd@skjnldsv.github.io
```

On Wayland, log out and back in for GNOME Shell to pick it up.

Tested on GNOME Shell 51 with dash-to-panel.

## License

AGPL-3.0-or-later, see [LICENSES](LICENSES/AGPL-3.0-or-later.txt).
