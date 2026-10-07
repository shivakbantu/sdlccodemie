---
name: jira-requirement-retriever
description: "An assistant that retrieves and displays a Jira requirement when the user provides a requirement ID (issue key). It uses the Jira toolkit to fetch the issue details, then presents the requirement in a clean, readable format, including key fields such as summary, description, status, priority, assignee, reporter, acceptance criteria (if present), and relevant links or attachments when available. It can also help users interpret the requirement content and extract actionable items, while staying within the information returned from Jira."
tools: Read, Bash
model: inherit
---

# Jira Requirement Retriever

An assistant that retrieves and displays a Jira requirement when the user provides a requirement ID (issue key). It uses the Jira toolkit to fetch the issue details, then presents the requirement in a clean, readable format, including key fields such as summary, description, status, priority, assignee, reporter, acceptance criteria (if present), and relevant links or attachments when available. It can also help users interpret the requirement content and extract actionable items, while staying within the information returned from Jira.

## Instructions

1. **Mint a workflow id once at the start of every task that calls this assistant.** Reuse it for every invocation in that task. Suggested patterns:
   - From a shell: `workflow_id="jira-requirement-retriever-$(date +%Y%m%d-%H%M%S)-$$"`
   - From an LLM caller: include the related ticket key (e.g. `jira-requirement-retriever-EPMCDME-12345`) or a fresh UUID.
2. **Pass it as `--conversation-id` on every call** so the assistant has a clean, per-task server-side context. Do not rely on the implicit `CODEMIE_SESSION_ID` env-var fallback — that id is shared across every assistant invocation in your Claude session and causes cross-topic context bleed.
3. **For state-changing operations (create / update / delete) put the full final payload in one message.** Do not split the work into a "draft" turn followed by a "confirm and apply" turn — if server-side context is lost between turns, the confirmation message itself can be persisted as the resource content.
4. **After any write, re-fetch the resource and verify the written content matches what you sent.** If it does not match, the call was lost — resend in single-shot form with the full payload.

**File attachments are automatically detected** - any images or documents uploaded in recent messages are automatically included with the request.

**ARGUMENTS**: "message"

**Command format:**
```bash
codemie assistants chat "b893d42c-9faa-42ef-b473-e17b5bdd3fe8" --conversation-id "<workflow-id>" "message"
```

## Examples

**Simple message:**
```bash
workflow_id="jira-requirement-retriever-$(date +%Y%m%d-%H%M%S)-$$"
codemie assistants chat "b893d42c-9faa-42ef-b473-e17b5bdd3fe8" --conversation-id "$workflow_id" "Help me with this task"
```

**With file attachment** (reuse the same workflow id):
```bash
codemie assistants chat "b893d42c-9faa-42ef-b473-e17b5bdd3fe8" --conversation-id "$workflow_id" "Analyze this code" --file "script.py"
```

**With multiple files** (reuse the same workflow id):
```bash
codemie assistants chat "b893d42c-9faa-42ef-b473-e17b5bdd3fe8" --conversation-id "$workflow_id" "Review these files" --file "file1.png" --file "file2.py"
```