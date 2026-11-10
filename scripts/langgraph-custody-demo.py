"""Actual LangGraph graph + ATG writer over stdio; synthetic deterministic fixture.

No LLM, provider account, live payment, independent reviewer or OS isolation.
The controller launches the writer; the graph's commands cannot select its DB,
key, clock or admin operation. Same-user host access remains a known weakness.
"""
import argparse
import copy
import importlib.metadata
import json
import os
from pathlib import Path
import selectors
import socket
import subprocess
from typing import TypedDict
from uuid import uuid4

NETWORK_ATTEMPTS = []

def refuse_network(*args, **kwargs):
    NETWORK_ATTEMPTS.append("blocked network operation")
    raise RuntimeError("OFFLINE_EVALUATION_NETWORK_DISABLED")

socket.socket.connect = refuse_network
socket.socket.connect_ex = refuse_network
socket.create_connection = refuse_network
socket.getaddrinfo = refuse_network

from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import StateGraph, START, END
from langgraph.types import Command, interrupt


class State(TypedDict):
    grant: dict
    result: dict


def run(args):
    root = Path(args.state).resolve()
    grant = json.loads((root / "agent-cache" / "grant.json").read_text())
    # Opt out of tracing explicitly: no account or telemetry is needed.
    env = {key: os.environ[key] for key in ("PATH", "SYSTEMROOT", "WINDIR", "TMPDIR", "TMP", "TEMP") if key in os.environ}
    env.update({"LANGSMITH_TRACING": "false", "LANGCHAIN_TRACING_V2": "false"})
    with subprocess.Popen(
        [args.node, str(Path(__file__).with_name("custody-worker.mjs")), str(root / "controller-owned")],
        stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
        text=True, bufsize=1, env=env,
    ) as writer:
        def exchange(value):
            writer.stdin.write(json.dumps(value) + "\n")
            writer.stdin.flush()
            with selectors.DefaultSelector() as selector:
                selector.register(writer.stdout, selectors.EVENT_READ)
                if not selector.select(timeout=10):
                    raise RuntimeError("WRITER_RESPONSE_TIMEOUT_NO_AUTOMATIC_RETRY")
            line = writer.stdout.readline()
            if not line:
                raise RuntimeError("WRITER_DISCONNECTED_NO_AUTOMATIC_RETRY")
            return json.loads(line)

        def gate(state: State):
            # Demonstration fixture only: the driver resumes this interrupt.
            approval = interrupt({"synthetic_approval_requested": True})
            if approval != {"approve": True}:
                return {"result": {"outcome": "REJECTED", "reason": "GRAPH_APPROVAL_REFUSED"}}
            return {"result": exchange({"op": "execute", "grant": state["grant"]})}

        graph = StateGraph(State)
        graph.add_node("exact_action_gate", gate)
        graph.add_edge(START, "exact_action_gate")
        graph.add_edge("exact_action_gate", END)
        app = graph.compile(checkpointer=InMemorySaver())

        def invoke(candidate, approved=True):
            config = {"configurable": {"thread_id": str(uuid4())}}
            paused = app.invoke({"grant": candidate, "result": {}}, config)
            assert paused.get("__interrupt__"), "Expected actual LangGraph interrupt"
            return app.invoke(Command(resume={"approve": approved}), config)["result"]

        results = []
        for name, candidate, approved, expected in [
            ("graph_refusal", grant, False, "REJECTED"),
            ("exact_approved", grant, True, "EXECUTED"),
            ("copied_agent_grant", copy.deepcopy(grant), True, "REJECTED"),
        ]:
            result = invoke(candidate, approved)
            assert result["outcome"] == expected, (name, result)
            results.append({"case": name, **result})
        changed = copy.deepcopy(grant)
        changed["proposedAction"]["canonicalArguments"]["payeeReference"] = "fixture-bank-B"
        result = invoke(changed)
        assert result["outcome"] == "REJECTED"
        results.append({"case": "changed_payee_after_approval", **result})
        # The agent command channel cannot turn itself into a controller.
        admin = exchange({"op": "stop", "grant": grant})
        assert admin["reason"] == "WITNESS_COMMAND_INVALID"
        results.append({"case": "agent_admin_attempt", **admin})
        recovered = exchange({"op": "lookup", "grant": grant})
        assert recovered["outcome"] == "EXECUTED"
        results.append({"case": "authoritative_lookup", **recovered})
        writer.stdin.close()
        writer.wait(timeout=10)
        assert writer.returncode == 0
    result = {
        "schema": "atg.langgraph-custody.synthetic.v1",
        "langgraph": importlib.metadata.version("langgraph"),
        "cases": results,
        "provider_requests": 0,
        "blocked_python_network_attempts": len(NETWORK_ATTEMPTS),
        "live_external_effects": 0,
        "production_ready": False,
        "independent_review": "NOT_PERFORMED",
        "limits": "Real framework with deterministic synthetic approval and local record writer; no autonomous LLM reasoning, buyer-defined integration, OS isolation, live payment or global anti-rollback proof.",
    }
    assert not NETWORK_ATTEMPTS, "Unexpected networking attempted during offline graph run"
    output = Path(args.output)
    with output.open("x") as stream:
        json.dump(result, stream, indent=2)
        stream.write("\n")
    print(json.dumps({"langgraph": result["langgraph"], "observed_cases": len(results), "provider_requests": 0, "production_ready": False}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--state", required=True)
    parser.add_argument("--node", required=True)
    parser.add_argument("--output", required=True)
    run(parser.parse_args())
