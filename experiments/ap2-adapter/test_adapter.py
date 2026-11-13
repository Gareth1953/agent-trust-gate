import copy
import hashlib
import base64
import json
import pathlib
import subprocess
import time
from dataclasses import replace

import pytest
from jwcrypto.jwk import JWK
from ap2.sdk.mandate import MandateClient
from ap2.sdk.jwt_helper import create_jwt
from ap2.sdk.generated.open_checkout_mandate import OpenCheckoutMandate
from ap2.sdk.generated.checkout_mandate import CheckoutMandate
from adapter import CheckoutTrust, verify_checkout, execute_checkout

ROOT=pathlib.Path(__file__).resolve().parents[2]

@pytest.fixture
def case():
    now=int(time.time())
    user=JWK.generate(kty='EC',crv='P-256');agent=JWK.generate(kty='EC',crv='P-256');merchant=JWK.generate(kty='EC',crv='P-256')
    trust=CheckoutTrust(JWK.from_json(user.export_public()),JWK.from_json(merchant.export_public()),'https://merchant.example','fixture-nonce',now)
    raw={'id':'checkout-001','merchant':{'id':'synthetic-merchant-A','name':'Synthetic Merchant'},
         'line_items':[{'id':'line-001','item':{'id':'SKU-A','title':'Synthetic Item','price':400000},'quantity':1,
                        'totals':[{'type':'subtotal','amount':400000},{'type':'total','amount':400000}]}],
         'status':'ready_for_complete','currency':'GBP','totals':[{'type':'subtotal','amount':400000},{'type':'total','amount':400000}],
         'links':[],'iat':now,'exp':now+120}
    constraints=[{'type':'checkout.allowed_merchants','allowed':[{'id':'synthetic-merchant-A','name':'Synthetic Merchant'}]},
                 {'type':'checkout.line_items','items':[{'id':'requirement-1','acceptable_items':[{'id':'SKU-A','title':'Synthetic Item'}],'quantity':1}]}]
    def make(checkout=None,root_key=None,merchant_key=None,hash_override=None,root_exp=None,constraint_override=None):
        obj=copy.deepcopy(raw if checkout is None else checkout)
        jwt=create_jwt({'alg':'ES256','typ':'JWT'},obj,merchant_key or merchant)
        digest=base64.urlsafe_b64encode(hashlib.sha256(jwt.encode()).digest()).decode().rstrip('=')
        client=MandateClient()
        opened=client.create([OpenCheckoutMandate(constraints=constraints if constraint_override is None else constraint_override,
            cnf={'jwk':json.loads(agent.export_public())},iat=now,exp=root_exp if root_exp is not None else now+120)],root_key or user)
        token=client.present(holder_key=agent,mandate_token=opened,
            payloads=[CheckoutMandate(checkout_jwt=jwt,checkout_hash=hash_override or digest,iat=now,exp=now+120)],
            aud=trust.audience,nonce=trust.nonce)
        return token
    return {'trust':trust,'make':make,'raw':raw,'now':now}

def test_real_sdk_signature_delegation_and_merchant_checkout(case):
    binding=verify_checkout(case['make'](),case['trust'])
    assert binding['amount_minor']==400000 and binding['currency']=='GBP'
    assert binding['expires_at']==case['now']+120

@pytest.mark.parametrize('field,value',[('audience','wrong'),('nonce','wrong'),('now',0)])
def test_wrong_host_context_refused(case,field,value):
    with pytest.raises(Exception):verify_checkout(case['make'](),replace(case['trust'],**{field:value}))

def test_wrong_root_key_refused(case):
    with pytest.raises(Exception):verify_checkout(case['make'](root_key=JWK.generate(kty='EC',crv='P-256')),case['trust'])

def test_wrong_merchant_signer_refused(case):
    with pytest.raises(Exception):verify_checkout(case['make'](merchant_key=JWK.generate(kty='EC',crv='P-256')),case['trust'])

def test_checkout_hash_is_computed_not_assumed(case):
    with pytest.raises(ValueError,match='HASH_MISMATCH'):verify_checkout(case['make'](hash_override='wrong'),case['trust'])

def test_expired_delegation_refused(case):
    with pytest.raises(Exception):verify_checkout(case['make'](root_exp=case['now']-1),case['trust'])

@pytest.mark.parametrize('kind',['currency','merchant','quantity','sku','total','expired','completed','extra','negative','float_price','hidden_item','line_total'])
def test_signed_but_disallowed_checkout_refused(case,kind):
    raw=copy.deepcopy(case['raw'])
    if kind=='currency':raw['currency']='USD'
    if kind=='merchant':raw['merchant']['id']='other'
    if kind=='quantity':raw['line_items'][0]['quantity']=2
    if kind=='sku':raw['line_items'][0]['item']['id']='other'
    if kind=='total':raw['totals'][1]['amount']=1
    if kind=='expired':raw['exp']=case['now']-1
    if kind=='completed':raw['status']='completed'
    if kind=='extra':raw['destination_override']='attacker'
    if kind=='negative':raw['line_items'][0]['item']['price']=-1
    if kind=='float_price':raw['line_items'][0]['item']['price']=400000.0
    if kind=='hidden_item':raw['line_items'][0]['item']['hidden']='extra'
    if kind=='line_total':raw['line_items'][0]['totals'][0]['amount']=1
    with pytest.raises(Exception):verify_checkout(case['make'](checkout=raw),case['trust'])

def test_empty_constraints_do_not_create_generic_authority(case):
    with pytest.raises(ValueError,match='CONSTRAINTS_REQUIRED'):verify_checkout(case['make'](constraint_override=[]),case['trust'])

def test_changed_token_bytes_refused(case):
    token=case['make']();parts=token.split('~~');root=parts[0].split('~');jwt=root[0].split('.')
    jwt[2]=('A' if jwt[2][0]!='A' else 'B')+jwt[2][1:];root[0]='.'.join(jwt);parts[0]='~'.join(root)
    with pytest.raises(Exception):verify_checkout('~~'.join(parts),case['trust'])

def test_live_node_destination_binds_verified_checkout_and_refuses_replay(case):
    binding=verify_checkout(case['make'](),case['trust'])
    process=subprocess.Popen(['node',str(ROOT/'experiments/ap2-adapter/destination.mjs')],cwd=ROOT,
        stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
    try:
        def submit(value):
            process.stdin.write(json.dumps(value)+'\n');process.stdin.flush()
            return json.loads(process.stdout.readline())
        assert execute_checkout(case['make'](),case['trust'],submit)['outcome']=='EXECUTED'
        assert submit(binding)['outcome']=='REJECTED'
        altered={**binding,'amount_minor':1}
        assert submit(altered)['outcome']=='REJECTED'
        assert submit({**binding,'expires_at':case['now']-1})['outcome']=='REJECTED'
    finally:
        process.stdin.close();process.wait(timeout=5)
        assert process.returncode==0,process.stderr.read()

def test_invalid_token_never_calls_destination(case):
    calls=[]
    result=execute_checkout('invalid',case['trust'],lambda b:calls.append(b))
    assert result['outcome']=='REJECTED' and calls==[]

def test_lost_destination_response_is_unknown_without_retry(case):
    calls=[]
    def unavailable(binding):
        calls.append(binding)
        raise OSError('lost response')
    result=execute_checkout(case['make'](),case['trust'],unavailable)
    assert result['outcome']=='UNKNOWN' and result['automaticRetryPermitted'] is False and len(calls)==1

def test_excessive_lifetime_cannot_supply_open_ended_authority(case):
    with pytest.raises(Exception):verify_checkout(case['make'](root_exp=case['now']+600),case['trust'])
