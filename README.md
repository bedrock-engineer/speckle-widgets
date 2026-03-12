# 🔷 speckle_widgets

> *View your Speckle models — right inside a Python (marimo!) notebook, no server required.*

**speckle_widgets** provides two [anywidgets](https://anywidget.dev) for [marimo](https://marimo.io): one to authenticate with a Speckle server using OAuth, and one to render 3D models in an interactive viewer. Both work in cloud-based marimo notebooks running Python via WebAssembly — no local server, no browser extension, no fuss.


## 🌟 Highlights

- **Two widgets in one package** — authenticate with Speckle, then view your models
- **Works in cloud marimo** ([marimo.app](https://marimo.app) / [molab](https://molab.marimo.io)) — no local HTTP server required
- **Load by URL** — paste any Speckle project URL and the model loads straight in
- **Load local objects** — visualise Python-side `specklepy` geometry without uploading to a server
- **Reactive** — widgets respond to Python state changes like any other marimo UI element


## ℹ️ Overview

[Speckle](https://speckle.systems) is an open-source platform for sharing and versioning 3D/BIM models. `speckle_widgets` brings it into the notebook by wrapping the official [`@speckle/viewer`](https://www.npmjs.com/package/@speckle/viewer) JavaScript library and the Speckle OAuth flow as anywidgets, so they compose naturally with marimo's reactive UI model.

The auth widget opens a popup to your Speckle server, completes the OAuth handshake via a `postMessage` callback, and stores the resulting token as a reactive trait — ready to be wired directly into the viewer. The viewer widget accepts either a Speckle URL or a list of `specklepy` objects serialised in-memory, so you can visualise geometry generated in Python without ever uploading it to a server.

### ✍️ Author

Built by [Joost Gevaert](https://github.com/jooostgevaert). Contributions, issues, and feedback are very welcome — see below.


## 🚀 Usage

### Authentication

```python
import marimo as mo
import speckle_widgets

auth = mo.ui.anywidget(
    speckle_widgets.SpeckleAuthWidget(
        server_url="https://app.speckle.systems",
        app_id="YOUR_APP_ID",
        app_secret="YOUR_APP_SECRET",
        # Must match a redirect URI registered in your Speckle App settings.
        # See the Installation section for how to set this up.
        callback_url="https://yourusername.github.io/speckle_widgets/callback.html",
    )
)
auth
```

After clicking **Sign in**, a popup opens for you to log in. Once complete, `auth.widget.token` and `auth.widget.user_name` are populated automatically.

### Viewer — URL mode

```python
viewer = mo.ui.anywidget(
    speckle_widgets.SpeckleViewerWidget(
        token=auth.widget.token,
        speckle_url="https://app.speckle.systems/projects/abc123/models/xyz456",
        height=600,
    )
)
viewer
```

### Viewer — local objects mode

Geometry you create in Python can be sent straight to the viewer without uploading it to a server first:

```python
from specklepy.objects.geometry import Mesh

mesh = Mesh(
    vertices=[0.0, 0.0, 0.0,  1.0, 0.0, 0.0,  0.5, 1.0, 0.0],
    faces=[3, 0, 1, 2],
)

viewer = mo.ui.anywidget(speckle_widgets.SpeckleViewerWidget(height=500))
viewer.widget.load_objects([mesh])
viewer
```

`load_objects` uses `specklepy`'s `MemoryTransport` to serialise the objects in-process — no network call is made.


## ⬇️ Installation

```bash
pip install speckle_widgets
```

Requires Python 3.10+ and a Speckle account. You'll also need to register an **App** in your Speckle server settings to get an `app_id` and `app_secret`.

### OAuth callback setup

Because cloud marimo runs in the browser, the OAuth redirect must go to a static page that forwards the auth code back to the widget via `postMessage`. The `docs/callback.html` file in this repository is that page. Host it on GitHub Pages:

1. Fork this repository
2. Go to **Settings → Pages → Source: `main` branch, `/docs` folder**
3. Your callback URL will be `https://yourusername.github.io/speckle_widgets/callback.html`
4. Register that URL as a redirect URI in your Speckle App settings

### Development setup

```bash
# Node (via nvm) + Python deps
nvm install --lts
npm install
uv sync --dev

# HMR dev mode — changes in src/ reflect live in marimo without restart
ANYWIDGET_HMR=1 npm run dev                            # terminal 1
ANYWIDGET_HMR=1 uv run marimo edit examples/demo.py    # terminal 2

# Production build
npm run build          # → speckle_widgets/static/auth.js + viewer.js
uv build               # → dist/speckle_widgets-0.1.0-py3-none-any.whl
```


## 💭 Feedback & contributing

Found a bug, have a feature request, or just want to say it worked? Please [open an issue](https://github.com/jooostgevaert/speckle_widgets/issues) or start a [discussion](https://github.com/jooostgevaert/speckle_widgets/discussions). Pull requests are welcome too.
