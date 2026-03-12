import os
import pathlib
import anywidget
import traitlets

DEV = os.environ.get("ANYWIDGET_HMR")


class SpeckleAuthWidget(anywidget.AnyWidget):
    _esm = (
        "http://localhost:5173/src/auth.js"
        if DEV
        else pathlib.Path(__file__).parent / "static" / "auth.js"
    )

    server_url = traitlets.Unicode("https://app.speckle.systems").tag(sync=True)
    app_id = traitlets.Unicode("").tag(sync=True)
    app_secret = traitlets.Unicode("").tag(sync=True)
    callback_url = traitlets.Unicode("").tag(sync=True)  # GitHub Pages URL — user must set
    token = traitlets.Unicode("").tag(sync=True)
    refresh_token = traitlets.Unicode("").tag(sync=True)
    is_authenticated = traitlets.Bool(False).tag(sync=True)
    user_name = traitlets.Unicode("").tag(sync=True)
    user_id = traitlets.Unicode("").tag(sync=True)
    error_message = traitlets.Unicode("").tag(sync=True)
