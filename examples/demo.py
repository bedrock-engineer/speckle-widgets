import marimo

__generated_with = "0.12.0"
app = marimo.App()


@app.cell
def _():
    import marimo as mo
    import speckle_widgets
    return mo, speckle_widgets


@app.cell
def _(mo, speckle_widgets):
    # ── Widget 1: Auth ────────────────────────────────────────────────────────
    # Register an app at your Speckle server → Apps → New App
    # Set the redirect URI to your GitHub Pages callback URL.
    auth = mo.ui.anywidget(
        speckle_widgets.SpeckleAuthWidget(
            server_url="https://app.speckle.systems",
            app_id="YOUR_APP_ID",
            app_secret="YOUR_APP_SECRET",
            # Must match the redirect URI registered in your Speckle App settings.
            # Deploy docs/ to GitHub Pages and use the URL below:
            callback_url="https://yourusername.github.io/speckle_widgets/callback.html",
        )
    )
    auth
    return (auth,)


@app.cell
def _(auth):
    # Show auth status
    print("Authenticated:", auth.widget.is_authenticated)
    print("User:", auth.widget.user_name)
    print("Token:", auth.widget.token[:20] + "..." if auth.widget.token else "(none)")
    return


@app.cell
def _(auth, mo, speckle_widgets):
    # ── Widget 2a: Viewer — URL mode ──────────────────────────────────────────
    viewer_url = mo.ui.anywidget(
        speckle_widgets.SpeckleViewerWidget(
            token=auth.widget.token,
            speckle_url="https://app.speckle.systems/projects/YOUR_PROJECT_ID/models/YOUR_MODEL_ID",
            height=600,
        )
    )
    viewer_url
    return (viewer_url,)


@app.cell
def _(auth, mo, speckle_widgets):
    # ── Widget 2b: Viewer — local objects mode ────────────────────────────────
    from specklepy.objects.geometry import Mesh

    # Simple triangle mesh
    mesh = Mesh(
        vertices=[0.0, 0.0, 0.0,  1.0, 0.0, 0.0,  0.5, 1.0, 0.0],
        faces=[3, 0, 1, 2],
    )

    viewer_local = mo.ui.anywidget(
        speckle_widgets.SpeckleViewerWidget(
            token=auth.widget.token,
            height=500,
        )
    )
    viewer_local.widget.load_objects([mesh])
    viewer_local
    return mesh, viewer_local


if __name__ == "__main__":
    app.run()
