"""Offline upstream-schema checks; no network reference resolution permitted."""
import json
import pathlib
import sys
from jsonschema import Draft202012Validator, FormatChecker
from referencing import Registry, Resource

root = pathlib.Path(__file__).parent / 'vendor/acs-v0.1.4/v0.1.0'
schemas = [json.loads(p.read_text()) for p in root.rglob('*.json')]
registry = Registry().with_resources((s['$id'], Resource.from_contents(s)) for s in schemas)
base = 'https://genai-security-project.github.io/agent-control-standard/schema/v0.1.0/'
def validator(name):
    schema = next(s for s in schemas if s['$id'] == base + name)
    return Draft202012Validator(schema, registry=registry, format_checker=FormatChecker())

report = json.loads(pathlib.Path(sys.argv[1]).read_text())
checks = 0
for request in report['requests']:
    validator('request-envelope.json').validate(request)
    validator('hooks/tool-call-request.json').validate(request['params']['payload'])
    checks += 2
for response in report['responses']:
    validator('response-envelope.json').validate(response)
    checks += 1
assert report['responses'][0]['result']['decision'] == 'deny'
assert report['responses'][1]['result']['decision'] == 'allow'
assert report['responses'][2]['result']['decision'] == 'deny'
assert report['beforeAdmissionExecution'] == 'NOT_RECORDED'
assert report['committed'] == 'EXECUTED' and report['destinationReplay'] == 'REJECTED'
print(json.dumps({'upstream_schema_checks': checks, 'passed': True, 'acs_core_conformance': False}))
