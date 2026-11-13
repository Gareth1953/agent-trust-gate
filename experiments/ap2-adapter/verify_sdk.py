"""Check installed AP2 Python source against the retained upstream commit."""
import hashlib
import importlib.util
import json
import pathlib

manifest=json.loads(pathlib.Path(__file__).with_name('sdk-source-manifest.json').read_text())
root=pathlib.Path(importlib.util.find_spec('ap2.sdk.mandate').origin).parents[1]
for name,expected in manifest['sha256'].items():
    if hashlib.sha256((root/name).read_bytes()).hexdigest()!=expected:
        raise RuntimeError('AP2_SDK_SOURCE_MISMATCH: '+name)
print(json.dumps({'sdk_commit':manifest['commit'],'source_files_verified':len(manifest['sha256'])}))
