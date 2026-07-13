# MCP Registry Readiness Boundary

## Purpose

This document explains why Agent Trust Gate is not currently an MCP server and why registry publication is not appropriate until a genuine, reviewed, publicly installable or accessible MCP server exists.

## Discovery Metadata Is Not Executable Tooling

The repository includes static metadata, schemas, local deterministic demos, and local CLIs. That is discovery and review material. It is not an MCP server, MCP tool set, MCP resource provider, MCP prompt provider, remote server declaration, or registry publication package.

## Requirements Before MCP Server Work

Before ATG could become a real MCP server, the project would need:

- explicit approved mission;
- server ownership and namespace decision;
- package and distribution decision;
- tool-scope design;
- authentication and authorization review;
- input/output safety review;
- read-only evaluation tools before any action-capable tools;
- local and protocol testing;
- registry metadata review;
- security and human-governance review.

## Registry Boundary

The official MCP Registry is not appropriate until a genuine MCP server exists and has been reviewed. P3-M142 does not create `server.json`, MCP tools, MCP resources, MCP prompts, publisher configuration, registry authentication, publication workflows, remote server declarations, or local client configuration.

## Safety Boundary

No MCP server functionality is added. No registry publication, login, tool execution, network call, or action execution is performed.
