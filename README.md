# Smooth j/k

Vimari-style smooth scrolling for Firefox, meant to run alongside Vimium.

Vimium animates scrolling itself at a constant speed. This add-on does what vimari does
instead: it passes a target to Firefox's built-in smooth scroll (`behavior: "smooth"`).
Repeated presses, including key-repeat while you hold `j`, push that same target further,
so the scroll keeps gliding and slows down gently at the end.

| Key | Action |
| --- | --- |
| `j` / `k` | Scroll down / up 150px |
| `d` / `u` | Scroll down / up half a screen |

All four keys can be changed in the settings, and there's a one-click Colemak preset
(`n` / `e` / `s` / `l`, the same physical keys).

It leaves keys alone while you're typing in a text field, and it ignores Cmd, Ctrl and Alt
combinations. Vimium still gets the keys first, so link hints and find mode keep working.
It scrolls the box you last clicked in, then moves out to the page once that box hits its
end. On web apps that lock the page, it scrolls the largest visible pane.

## 1. Unmap the keys in Vimium

Open Vimium's options and add these lines under **Custom key mappings** (use your own keys if you changed them, e.g.
`n e s l` for the Colemak preset):

```
unmap j
unmap k
unmap d
unmap u
```

## 2. Install

**Quick try (removed when Firefox restarts):** open `about:debugging#/runtime/this-firefox`,
click **Load Temporary Add-on…**, and pick `manifest.json` in this folder.

**Permanent:** release Firefox only installs add-ons that Mozilla has signed. Signing as
*unlisted* is free and private: it never appears on addons.mozilla.org.

1. Sign in at https://addons.mozilla.org/developers/ and accept the developer agreement if
   asked.
2. Generate API credentials at https://addons.mozilla.org/developers/addon/api/key/.
3. Sign it with [web-ext](https://github.com/mozilla/web-ext), passing the credentials through
   `WEB_EXT_API_KEY` / `WEB_EXT_API_SECRET`:

   ```
   npx web-ext sign --channel=unlisted
   ```

   The signed `.xpi` lands in `web-ext-artifacts/`. Open it in Firefox and click **Add**.

If you loaded a temporary copy from `about:debugging`, remove it first.

To ship a change later, bump `version` in `manifest.json` and sign again. Firefox doesn't
auto-update unlisted add-ons that have no update URL, so open the new `.xpi` the same way.

## 3. Settings

Open `about:addons`, then Smooth j/k → **Preferences**. Changes apply right away in open
tabs, and the box at the bottom lets you try them out.

| Setting | Default | What it does |
| --- | --- | --- |
| Keys | `j` `k` `d` `u` | Scroll down, up, half page down, half page up. Click a box and press a key; QWERTY and Colemak presets |
| j / k step | 150 px | How far one press of scroll down/up goes |
| d / u distance | 50% | How much of the visible height half page down/up scroll |
| Chain window | 200 ms | Presses closer together than this add to the same glide |

Settings are saved with Firefox Sync if you use it.

## 4. Tuning the animation

- **Keep Firefox's smooth scrolling on:** Settings → General → Browsing → *Use smooth
  scrolling*. The add-on relies on that animation.
- **Animation feel:** Firefox runs `behavior: "smooth"` scrolls with a spring model. In
  `about:config`, look for `layout.css.scroll-behavior.spring-constant` (lower is slower and
  floatier) and `layout.css.scroll-behavior.damping-ratio` (below `1` overshoots slightly,
  which gives a small bounce). If your Firefox version doesn't have these, the defaults
  still apply.
