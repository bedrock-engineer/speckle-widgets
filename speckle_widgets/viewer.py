import json
import os
import pathlib
import anywidget
import traitlets

DEV = os.environ.get("ANYWIDGET_HMR")


class SpeckleViewerWidget(anywidget.AnyWidget):
    _esm = (
        "http://localhost:5173/src/viewer.js"
        if DEV
        else pathlib.Path(__file__).parent / "static" / "viewer.js"
    )

    token = traitlets.Unicode("").tag(sync=True)
    server_url = traitlets.Unicode("https://app.speckle.systems").tag(sync=True)
    speckle_url = traitlets.Unicode("").tag(sync=True)   # URL mode
    objects_json = traitlets.Unicode("").tag(sync=True)  # local objects mode
    is_loading = traitlets.Bool(False).tag(sync=True)
    error_message = traitlets.Unicode("").tag(sync=True)
    height = traitlets.Int(500).tag(sync=True)

    def load_objects(self, objects: list) -> None:
        """
        Serialize specklepy Base objects and pass to viewer without server upload.
        Uses MemoryTransport to produce a flat { id: json_str } map.
        """
        from specklepy.api import operations
        from specklepy.transports.memory import MemoryTransport

        transport = MemoryTransport()
        root_ids = []
        for obj in objects:
            root_id = operations.send(base=obj, transports=[transport])
            root_ids.append(root_id)

        payload = {
            "root_ids": root_ids,
            "objects": transport.objects,  # { id: json_string }
        }
        self.speckle_url = ""
        self.objects_json = json.dumps(payload)
