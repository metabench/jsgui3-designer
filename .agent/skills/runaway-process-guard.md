---
description: Prevent infinite loops, stuck servers, and runaway processes
---

# Runaway Process Guard (Designer Edition)

## Triggers
- runaway processes, infinite loops, timeout, stuck command, hanging script

## Scope
Applies to:
- The `node server.js` long-running process
- Any custom scripts that poll or loop
- Browser subagent tasks that might hang

## The 3 Pillars

### 1. Hard Timeboxing
Every custom script with a loop MUST have a wall-clock timeout:
```javascript
const MAX_WAIT_MS = 60000; // 1 minute
const start = Date.now();
while (running && (Date.now() - start < MAX_WAIT_MS)) {
    // ... poll ...
}
if (running) {
    console.error("TIMEOUT_CIRCUIT_BREAKER_TRIPPED");
    process.exit(1);
}
```

### 2. Server Process Management
The designer server (`node server.js`) runs indefinitely. Rules:
- **Always terminate before restarting** — Use `send_command_input` with `Terminate: true`
- **Check if already running** — Before starting, check for existing processes
- **Typical startup time**: ~10 seconds (bundling + compression)
- **Ready signal**: Look for `"Server ready"` in output

### 3. Semantic Repetition Detection
When checking command status:
- If the output hasn't changed after 3 checks over 60 seconds, assume deadlock
- Don't passive-poll hoping it resolves
- Terminate and investigate

## Designer-Specific Patterns

### Server Restart Sequence
```
1. send_command_input(CommandId, Terminate: true)  // Kill old server
2. Wait 2 seconds for cleanup
3. run_command("node server.js")                   // Start fresh
4. command_status(wait 30s)                        // Wait for "Server ready"
```

### Browser Subagent Timeout
Browser subagent tasks should complete within 2-3 minutes. If they take longer,
something is stuck (usually waiting for a non-existent element).

## Escalation
When a circuit breaker trips:
1. Don't immediately retry the same approach
2. Record the failure
3. Investigate if the underlying system has an alternate mechanism
4. Ask the user if the mechanism seems fundamentally broken
