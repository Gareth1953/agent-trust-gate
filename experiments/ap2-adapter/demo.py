"""Run one fresh, synthetic end-to-end exchange; retain no tokens or keys."""
import json
import subprocess
from adapter import execute_checkout
from test_adapter import case, ROOT

fixture=case.__wrapped__()
process=subprocess.Popen(['node',str(ROOT/'experiments/ap2-adapter/destination.mjs')],cwd=ROOT,
    stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
calls=0
def commit(binding):
    global calls
    calls+=1
    process.stdin.write(json.dumps(binding)+'\n');process.stdin.flush()
    return json.loads(process.stdout.readline())
try:
    token=fixture['make']()
    invalid=execute_checkout('invalid',fixture['trust'],commit)
    before=calls
    permitted=execute_checkout(token,fixture['trust'],commit)
    replay=execute_checkout(token,fixture['trust'],commit)
    print(json.dumps({'schema':'atg.ap2.synthetic-walkthrough.v1','syntheticOnly':True,
        'sdkCommit':'e1ea56db72a6385bce3e5c1112b3a56ce60acb43',
        'invalidToken':invalid,'destinationCallsAfterInvalidToken':before,
        'permitted':permitted,'replay':replay,'destinationCalls':calls,
        'livePayment':False,'productionReady':False},indent=2))
finally:
    process.stdin.close();process.wait(timeout=5)
    if process.returncode:raise RuntimeError(process.stderr.read())
