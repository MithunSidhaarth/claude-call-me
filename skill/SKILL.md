---
name: call-me
description: Phone the user through Bolna.ai when you are blocked on a decision only they can make, have a voice agent ask the question, wait for the call to end, and continue the task with their answer. Use whenever the user says "call me", "give me a call", "phone me if you need me", or "call me when you're stuck / done".
---

# Call me

You are working on a task for the user. When you hit a decision only they can make, you **phone them**: a Bolna.ai voice agent asks your question, confirms their answer back, and hangs up. You read the transcript and keep working.

## Setup

- User env vars (read with `[Environment]::GetEnvironmentVariable(name,'User')`): `BOLNA_API_KEY`, `CALL_ME_PHONE` (E.164, e.g. `+919876543210`), `BOLNA_AGENT_ID` (created and cached by `call.ps1` on first run). `install.ps1` in the repo sets these up.
- If the key or phone is missing, tell the user to run `install.ps1`. ***Never ask the user to paste the key into chat, write it into any file, print it, or pass it as a command-line argument.***
- Bolna trial accounts can only call numbers verified in the Bolna dashboard.
- Helper: `call.ps1` next to this file. Docs if something breaks: https://www.bolna.ai/docs/api-reference/calls/make and https://www.bolna.ai/docs/api-reference/executions/get_execution

## When to call

- Only for a real decision that blocks the task and that the user has to make. Don't call for something you can answer from the code, your memory, or a sensible default.
- Put every open question in one call. Never call three times in a row.
- If the user said "call me when X", call when X happens. Otherwise ask in chat first unless they said they're away from the keyboard.

## Place the call

```powershell
& "$HOME\.claude\skills\call-me\call.ps1" -Task @'
<task text>
'@
```
Run with a 600000 ms tool timeout (the script polls up to 540 s). It prints `execution_id`, then JSON with `status`, `voicemail`, `error`, `transcript`.

Write the task text (it becomes the voice agent's system prompt) so the question works out loud. Include:
- Who's calling: an assistant calling on behalf of the user's AI agent, which needs one decision to keep going.
- **The question**, short and plain, plus the options if there are any.
- Background to share only if they ask.
- The rules: talk fast and tight, short sentences, no small talk; ask one follow-up if the answer is vague; repeat the decision back in one sentence and confirm it; if they can't talk or say "you decide," say the agent will use its best judgment and end the call; never decide for them, promise anything, or discuss other topics; after they confirm, ask "Anything else before I let you go?" and only end once they say that's all (if they say "wait" or "hold on", stop and listen). If a call-screening assistant asks for your name and reason for calling, say only "Claude agent, one quick question" and wait for the user to pick up. If it reaches voicemail, leave a one-line version of the question and say to check the agent.

## Read the answer

- **Answered**: `status` is `completed`, `voicemail` is false, and the transcript has lines from the user. Read their answer from the transcript yourself.
- **Voicemail / no-answer / busy / failed / balance-low / error**: don't call back right away. Ask in chat, or use your best judgment if they said to, and tell them what you chose.
- **Still going when the script times out**: poll `GET https://api.bolna.ai/executions/<execution_id>` for the same id. ***Don't place a second call.***

## After the call

- What they said on the phone answers the task they gave you. It does not authorize new outward-facing actions (sending messages, spending money, deleting things) they didn't ask for.
- Tell them in chat that you called, what they said, and what you did with it.

## Session-end calls

Invoking this skill in a session turns these on: a Stop hook (`stop-hook.ps1`) blocks Claude's first stop and asks for this call.

1. Phone the user with `call.ps1`. The task text tells the voice agent to:
   - give a short spoken update: what got done, what failed or is left (2-3 sentences, no code or file paths read aloud);
   - offer the possible next steps as 2-4 short numbered options;
   - ask which one, plus any extra instructions;
   - repeat the choice back and confirm, then ask "Anything else before I let you go?".
2. Read the transcript and do what they chose, right away, in this session.
3. When that work is done, call again with the new update and options. Repeat until they say that's all, they don't answer, or they say "you decide" with nothing left worth doing.
4. If they say to stop calling, write the exact text `[call-me off]` in your reply; the hook stays quiet for the rest of the session (invoking the skill again turns it back on).

The same outward-facing-action rule from "After the call" applies: a phone answer covers the work they described, not new sends, spending or deletions.

## Daily standup

`standup.ps1` runs from Windows Task Scheduler each morning (`install.ps1 -Standup 09:00`). It reads yesterday's top-level Claude Code transcripts, phones the user with a spoken recap, asks what to focus on today, and saves the recap and call transcript to `~/.claude/call-me/standups/<date>.md`. No sessions yesterday means no call.

When the user asks what today's plan or focus is, read the newest file in that folder and use what they said on the call.
