## todo

- doubt-early
  - related to prototype-first: when AI should consider prototyping, sometimes (not always) it's within XY problem on the wrong execution path
  - relation between prototype-first and doubt-early, what is the order?
  - pick [Confusion Management](.tmp/addy-agent-skills/skills/context-engineering/SKILL.md) section somewhere. but rewrite to "escalate"/"spawn subagent to think and document" wording instead of "stop and ask"

- different models for different subagents?
  - eg coder is gpt, reviewer is claude and so on?
  - parametrization to avoid hardcoding model into agent md description?
  - can orchestrator select a model for subagent in runtime, or this is config-level?

- bootstrap more CLIs, eg codex/gemini
  - preconfigure
  - create/find per-cli usage skills

- make a map/table of agent level teamlead/teammate/subagent and skills available/recommended/blocked for the level

- in main meta-skill (intro), define and explain "ceremony scales with task" rule, set task/repo measurement rules

- in skill for spawning subagents MAYBE add prompting rules from [context-management skill](.tmp/addy-agent-skills/skills/context-engineering/SKILL.md)
