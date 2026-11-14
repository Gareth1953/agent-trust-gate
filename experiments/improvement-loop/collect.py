"""Automatic test-evidence collection; never modifies policy or production code."""
import argparse
import datetime
import hashlib
import json
import os
import pathlib
import re
import subprocess
import sys
import uuid
import xml.etree.ElementTree as ET

ROOT=pathlib.Path(__file__).resolve().parents[2]


def classify(exit_code,tests,failures,skips=0):
    if any(type(v) is not int or v<0 for v in [tests,failures,skips]) or tests==0 or failures+skips>tests:
        return 'BLOCKED'
    if exit_code!=0 or failures:
        return 'FAIL'
    if skips:
        return 'BLOCKED'
    return 'PASS'


def node_counts(text):
    def count(name):
        values=re.findall(r'^# '+name+r' (\d+)\s*$',text,re.M)
        if len(values)!=1:raise ValueError('UNUSABLE_NODE_TEST_SUMMARY')
        return int(values[0])
    tests,failed,skipped=count('tests'),count('fail'),count('skipped')
    if count('pass')+failed+skipped!=tests or count('cancelled') or count('todo'):
        raise ValueError('INCOMPLETE_NODE_TEST_SUMMARY')
    return tests,failed,skipped


def source_snapshot():
    paths=[]
    for directory in ['src','test','scripts','experiments/acs-adapter','experiments/ap2-adapter',
                      'experiments/aws-agentcore-adapter','experiments/improvement-loop']:
        paths.extend(p for p in (ROOT/directory).rglob('*') if p.is_file()
                     and not {'node_modules','__pycache__','.pytest_cache'} & set(p.parts)
                     and p.suffix in {'.ts','.mjs','.py','.json'})
    return {p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(paths)}


def review_packet(results):
    # Fixed review topics, not model-authored patches or executable instructions.
    return [{'suite':r['suite'],'topic':('REPAIR_REPRODUCIBLE_FAILURE' if r['status']=='FAIL' else
            'RESTORE_TEST_EVIDENCE' if r['status']=='BLOCKED' else 'EXTERNAL_VALIDATION_STILL_REQUIRED'),
            'requires_human_review':True,'authority_granted':False} for r in results]


def collect(out,python_executable=None):
    out=pathlib.Path(out);out.mkdir(parents=True,exist_ok=True)
    run_id=str(uuid.uuid4());private=out/('private-'+run_id);private.mkdir(mode=0o700)
    sources=source_snapshot()
    suites=[('acs',['node','--test','--test-reporter=tap','experiments/acs-adapter/adapter.test.mjs','experiments/acs-adapter/transport.test.mjs']),
            ('aws-contract',['node','--test','--test-reporter=tap','experiments/aws-agentcore-adapter/adapter.test.mjs'])]
    if python_executable:
        suites.append(('ap2',[python_executable,'-m','pytest','-q','experiments/ap2-adapter/test_adapter.py','--junitxml='+str(private/'ap2.xml')]))
    results=[]
    for name,command in suites:
        code=None;text='';tests=failures=skips=0
        try:
            run=subprocess.run(command,cwd=ROOT,capture_output=True,text=True,timeout=120)
            code=run.returncode;text=run.stdout+'\n'+run.stderr
            if name=='ap2':
                xml=ET.parse(private/'ap2.xml').getroot()
                cases=xml.findall('.//testcase');tests=len(cases)
                failures=sum(c.find('failure') is not None or c.find('error') is not None for c in cases)
                skips=sum(c.find('skipped') is not None for c in cases)
            else:tests,failures,skips=node_counts(text)
            status=classify(code,tests,failures,skips)
        except Exception:
            status='BLOCKED'
        (private/(name+'.log')).write_text(text)
        results.append({'suite':name,'status':status,'tests':tests,'failures':failures,'skips':skips,
            'exit_code':code,'log_sha256':hashlib.sha256(text.encode()).hexdigest()})
    if not python_executable:
        results.append({'suite':'ap2','status':'BLOCKED','tests':0,'failures':0,'skips':0,'exit_code':None,'reason':'AP2_PYTHON_NOT_CONFIGURED'})
    stable=sources==source_snapshot()
    if not stable:
        for result in results:result['status']='BLOCKED';result['reason']='SOURCE_CHANGED_DURING_RUN'
    commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
    dirty=bool(subprocess.check_output(['git','status','--porcelain'],cwd=ROOT,text=True))
    report={'schema':'atg.improvement-evidence.v1','run_id':run_id,'commit':commit,
        'observed_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'synthetic_only':True,'source_tree_dirty':dirty,'source_stable_during_run':stable,'source_sha256':sources,
        'suites':results,'review_candidates':review_packet(results),
        'policy_changes_applied':False,'production_authority_granted':False,
        'independent_review_obtained':False,'community_acceptance_established':False}
    # Exclusive creation preserves prior runs and failed evidence.
    path=out/(run_id+'.json')
    with path.open('x') as f:json.dump(report,f,indent=2);f.write('\n')
    print(json.dumps({'report':str(path),'suites':results,'automatic_policy_changes':False}))
    return 0 if all(r['status']=='PASS' for r in results) else 1


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--out',required=True)
    parser.add_argument('--ap2-python',default=os.environ.get('ATG_AP2_PYTHON'))
    args=parser.parse_args();sys.exit(collect(args.out,args.ap2_python))
