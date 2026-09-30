#!/usr/bin/env node
// Local stdio entry point for the ManifestYOU MCP server.
// Runs the same handler as the hosted /.netlify/functions/mcp endpoint,
// reading newline-delimited JSON-RPC from stdin and writing replies to stdout.
//
//   MANIFESTYOU_API_KEY=... node bin/mcp-stdio.js
//
// The key is only needed for tools/call. initialize and tools/list work without it.

const readline = require("readline");
const { handler } = require("../netlify/functions/mcp");

const apiKey = (process.env.MANIFESTYOU_API_KEY || "").trim();
const headers = apiKey ? { "x-api-key": apiKey } : {};

const rl = readline.createInterface({ input: process.stdin, terminal: false });

rl.on("line", async (line) => {
  if (!line.trim()) return;
  try {
    const res = await handler({ httpMethod: "POST", headers, body: line });
    // Notifications come back with an empty body and need no reply.
    if (res.body) process.stdout.write(res.body + "\n");
  } catch (err) {
    process.stderr.write(`mcp-stdio error: ${err.message}\n`);
  }
});
