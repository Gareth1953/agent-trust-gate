"""Synthetic checkout bridge using the pinned, unmodified AP2 Python SDK.

Trust and clock are host inputs. No request-supplied verification flags or keys.
This implements one narrow delegated checkout profile, not payment execution.
"""
import base64
import hashlib
import json
import re
from dataclasses import dataclass

from ap2.sdk.mandate import MandateClient
from ap2.sdk.checkout_mandate_chain import CheckoutMandateChain
from ap2.sdk.generated.types.checkout import Checkout
from jwcrypto.jwk import JWK
from jwcrypto.jws import JWS


@dataclass(frozen=True)
class CheckoutTrust:
    root_public_key: JWK
    merchant_public_key: JWK
    audience: str
    nonce: str
    now: int
    merchant_id: str = 'synthetic-merchant-A'
    maximum_amount: int = 500000


def _json(raw):
    def unique(pairs):
        value = {}
        for key, item in pairs:
            if key in value:
                raise ValueError('DUPLICATE_JSON_MEMBER')
            value[key] = item
        return value
    return json.loads(raw, object_pairs_hook=unique,
                      parse_constant=lambda _: (_ for _ in ()).throw(ValueError('NONFINITE_JSON')))


def _part(value):
    if not re.fullmatch(r'[A-Za-z0-9_-]+', value):
        raise ValueError('NONCANONICAL_BASE64URL')
    decoded = base64.urlsafe_b64decode(value + '=' * (-len(value) % 4))
    if base64.urlsafe_b64encode(decoded).decode().rstrip('=') != value:
        raise ValueError('NONCANONICAL_BASE64URL')
    return decoded


def verify_checkout(token: str, trust: CheckoutTrust) -> dict:
    if not isinstance(token, str) or len(token.encode()) > 65536 or len(token.split('~~')) != 2:
        raise ValueError('UNSUPPORTED_MANDATE_CHAIN')
    if trust.merchant_id != 'synthetic-merchant-A' or not trust.audience or not trust.nonce:
        raise ValueError('HOST_TRUST_REQUIRED')
    # Refuse duplicate JSON names, unsupported algorithms and noncanonical
    # encodings before the SDK decodes each signed JWT/disclosure.
    for segment in token.split('~~'):
        for component in segment.split('~'):
            if not component:
                continue
            if component.count('.') == 2:
                header, payload, signature = component.split('.')
                h = _json(_part(header)); claims = _json(_part(payload)); _part(signature)
                if h.get('alg') != 'ES256' or set(h) - {'alg', 'typ', 'kid'}:
                    raise ValueError('UNSUPPORTED_JWT_HEADER')
                if claims.get('_sd_alg','sha-256') != 'sha-256':
                    raise ValueError('UNSUPPORTED_DISCLOSURE_HASH')
            else:
                _json(_part(component))
    payloads = MandateClient().verify(
        token=token, key_or_provider=lambda _: trust.root_public_key,
        expected_aud=trust.audience, expected_nonce=trust.nonce,
        current_time=trust.now, clock_skew_seconds=0,
    )
    chain = CheckoutMandateChain.parse(payloads)
    # Only this explicit complete two-hop profile is mapped. Unknown extensions
    # cannot be silently dropped by permissive upstream model parsing.
    allowed = [{'vct','constraints','cnf','iat','exp'}, {'vct','checkout_jwt','checkout_hash','iat','exp'}]
    for payload, fields in zip(payloads, allowed, strict=True):
        if set(payload) - fields:
            raise ValueError('UNSUPPORTED_MANDATE_FIELDS')
        if any(type(payload.get(k)) is not int for k in ['iat','exp']):
            raise ValueError('MANDATE_LIFETIME_REQUIRED')
        if not payload['iat'] <= trust.now < payload['exp'] or payload['exp'] - trust.now > 300:
            raise ValueError('MANDATE_LIFETIME_INVALID')
    jwt = chain.closed_mandate.checkout_jwt
    expected_hash = base64.urlsafe_b64encode(hashlib.sha256(jwt.encode()).digest()).decode().rstrip('=')
    if chain.closed_mandate.checkout_hash != expected_hash:
        raise ValueError('CHECKOUT_HASH_MISMATCH')
    header, body, signature = jwt.split('.')
    h = _json(_part(header)); raw = _json(_part(body)); _part(signature)
    if h.get('alg') != 'ES256' or set(h) - {'alg','typ','kid'}:
        raise ValueError('UNSUPPORTED_MERCHANT_JWT_HEADER')
    signed = JWS(); signed.deserialize(jwt)
    signed.verify(trust.merchant_public_key, alg='ES256')
    if set(raw) != {'id','merchant','line_items','status','currency','totals','links','iat','exp'}:
        raise ValueError('UNSUPPORTED_CHECKOUT_FIELDS')
    if type(raw['iat']) is not int or type(raw['exp']) is not int or not raw['iat'] <= trust.now < raw['exp']:
        raise ValueError('CHECKOUT_EXPIRED_OR_FUTURE')
    checkout = Checkout.model_validate(raw)
    if set(raw['merchant']) != {'id','name'} or raw['links'] != []:
        raise ValueError('UNSUPPORTED_MERCHANT_OR_LINKS')
    if checkout.merchant is None or checkout.merchant.id != trust.merchant_id:
        raise ValueError('MERCHANT_NOT_PINNED')
    if checkout.currency != 'GBP' or checkout.status.value != 'ready_for_complete':
        raise ValueError('UNSUPPORTED_CHECKOUT_STATE_OR_CURRENCY')
    if not re.fullmatch(r'[A-Za-z0-9_-]{1,80}', checkout.id):
        raise ValueError('CHECKOUT_ID_INVALID')
    # Deliberately require one explicit merchant constraint and one line-item
    # constraint. General/open-ended commerce authorisation is unsupported.
    if len(chain.open_mandate.constraints) != 2 or sorted(c.type for c in chain.open_mandate.constraints) != ['checkout.allowed_merchants','checkout.line_items']:
        raise ValueError('EXPLICIT_CHECKOUT_CONSTRAINTS_REQUIRED')
    if chain.verify(expected_checkout_hash=expected_hash, checkout_jwt=jwt):
        raise ValueError('CHECKOUT_CONSTRAINT_VIOLATION')
    for item in raw['line_items']:
        if set(item) != {'id','item','quantity','totals'} or set(item['item']) != {'id','title','price'}:
            raise ValueError('UNSUPPORTED_LINE_ITEM_FIELDS')
        if type(item['quantity']) is not int or type(item['item']['price']) is not int:
            raise ValueError('MINOR_UNITS_AND_QUANTITY_MUST_BE_INTEGERS')
        expected=item['quantity']*item['item']['price']
        if len(item['totals']) != 2 or {t['type'] for t in item['totals']} != {'total','subtotal'} or any(set(t)!={'type','amount'} or type(t['amount']) is not int or t['amount']!=expected for t in item['totals']):
            raise ValueError('INCONSISTENT_LINE_TOTALS')
    if not checkout.line_items or any(type(i.quantity) is not int or i.quantity <= 0 or type(i.item.price) is not int or i.item.price < 0 for i in checkout.line_items):
        raise ValueError('INVALID_LINE_ITEMS')
    total = sum(i.quantity*i.item.price for i in checkout.line_items)
    totals = raw['totals']
    if len(totals) != 2 or {t['type'] for t in totals} != {'total','subtotal'} or any(set(t)!={'type','amount'} or type(t['amount']) is not int or t['amount'] != total for t in totals):
        raise ValueError('UNSUPPORTED_OR_INCONSISTENT_TOTALS')
    if total <= 0 or total > trust.maximum_amount:
        raise ValueError('HOST_AMOUNT_LIMIT')
    return {'merchant_id':checkout.merchant.id,'checkout_id':checkout.id,'currency':'GBP',
            'amount_minor':total,'checkout_hash':hashlib.sha256(jwt.encode()).hexdigest(),
            'expires_at':min(raw['exp'],*(p['exp'] for p in payloads))}


def execute_checkout(token: str, trust: CheckoutTrust, commit):
    """Trusted-host sequencing: no destination call unless verification succeeds.

    `commit` is a host-owned private pipe, never a user-specified destination.
    It must retain its ATG store. A crashed/failed pipe cannot authorise retry.
    """
    try:
        binding=verify_checkout(token, trust)
    except Exception:
        return {'outcome':'REJECTED','reason':'AP2_CHECKOUT_NOT_VERIFIED','automaticRetryPermitted':False}
    try:
        return commit(binding)
    except Exception:
        return {'outcome':'UNKNOWN','reason':'AP2_DESTINATION_OUTCOME_UNKNOWN','automaticRetryPermitted':False}
