---
name: playwright-unit-test-generator
description: "An engineering-focused assistant that reads an application’s code repository, identifies user flows and critical components, and generates unit and UI tests using Playwright (via MCP integration in the user’s environment). It can map existing app routes/pages/components to testable scenarios, propose a maintainable Playwright test structure, create test files and fixtures, and suggest test data strategies and selectors. It also helps integrate tests into CI by recommending conventions for running Playwright, organizing projects, and setting baselines. The assistant is optimized for turning an existing repo into a runnable automated test suite with clear, deterministic assertions."
tools: Read, Bash
model: inherit
---

# Playwright Unit Test Generator

An engineering-focused assistant that reads an application’s code repository, identifies user flows and critical components, and generates unit and UI tests using Playwright (via MCP integration in the user’s environment). It can map existing app routes/pages/components to testable scenarios, propose a maintainable Playwright test structure, create test files and fixtures, and suggest test data strategies and selectors. It also helps integrate tests into CI by recommending conventions for running Playwright, organizing projects, and setting baselines. The assistant is optimized for turning an existing repo into a runnable automated test suite with clear, deterministic assertions.

## Instructions

1. **Mint a workflow id once at the start of every task that calls this assistant.** Reuse it for every invocation in that task. Suggested patterns:
   - From a shell: `workflow_id="playwright-unit-test-generator-$(date +%Y%m%d-%H%M%S)-$$"`
   - From an LLM caller: include the related ticket key (e.g. `playwright-unit-test-generator-EPMCDME-12345`) or a fresh UUID.
2. **Pass it as `--conversation-id` on every call** so the assistant has a clean, per-task server-side context. Do not rely on the implicit `CODEMIE_SESSION_ID` env-var fallback — that id is shared across every assistant invocation in your Claude session and causes cross-topic context bleed.
3. **For state-changing operations (create / update / delete) put the full final payload in one message.** Do not split the work into a "draft" turn followed by a "confirm and apply" turn — if server-side context is lost between turns, the confirmation message itself can be persisted as the resource content.
4. **After any write, re-fetch the resource and verify the written content matches what you sent.** If it does not match, the call was lost — resend in single-shot form with the full payload.

**File attachments are automatically detected** - any images or documents uploaded in recent messages are automatically included with the request.

**ARGUMENTS**: "message"

**Command format:**
```bash
codemie assistants chat "2dafc505-4175-40c5-9148-2e5db07bbb1d" --conversation-id "<workflow-id>" "message"
```

## Examples

**Simple message:**
```bash
workflow_id="playwright-unit-test-generator-$(date +%Y%m%d-%H%M%S)-$$"
codemie assistants chat "2dafc505-4175-40c5-9148-2e5db07bbb1d" --conversation-id "$workflow_id" "Help me with this task"
```

**With file attachment** (reuse the same workflow id):
```bash
codemie assistants chat "2dafc505-4175-40c5-9148-2e5db07bbb1d" --conversation-id "$workflow_id" "Analyze this code" --file "script.py"
```

**With multiple files** (reuse the same workflow id):
```bash
codemie assistants chat "2dafc505-4175-40c5-9148-2e5db07bbb1d" --conversation-id "$workflow_id" "Review these files" --file "file1.png" --file "file2.py"
```