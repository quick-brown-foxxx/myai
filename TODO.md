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
  - add initial project size estimation guide to understand how complex the workflow should be. Eg in small script it's ok to do quick edits with manual check, in big production monorepo all fixes will require testing

- in skill for spawning subagents MAYBE add prompting rules from [context-management skill](.tmp/addy-agent-skills/skills/context-engineering/SKILL.md)

- enroll own or merge:
  - merge `browser-testing-with-devtools` from addy with POLZA's skill
  - merge addy's `frontend-ui-engineering` with my nextjs template/skills

- copy from wikipedia and put in all proper places: offensive programming instead of defensive

- later: decouple skills from main workflow, make them complementary but skills should be useful even without workflow. For cases when a system already has own workflow (GasTown)

- "**Announce at start:** using `skill-name` to do XXX" form superpowers is nice pattern, will copy it

- subagents dispatching skills: list relevant/useful skills for the task in prompt of a subagent
  - reviewer subagents should use relevant architecting/test-strategy and so on skills

- meta-workflow and lower-level sub-workflows that connect skills

- later new collections to .tmp/:
  - <https://github.com/anomalyco/opencode/tree/dev/.opencode/skills/improve-codebase-architecture>
  - <https://github.com/GoogleChrome/modern-web-guidance-src>

- run over all borrowed skills to check if we can enrich them with our PHILOSOPHY or practices
- ensure all our skills are consistent
- double check discovery/invocation of all skills' descriptions
- maybe pick validate-skills.js from addy
- cover commenting code. rule: required for business logic, complex tricks/hacks required to bypass a bug or needed by framework. Not needed for simple boilerplate code like controllers/react configuration and so on
- "let's imagine it already failed. why?" pattern in planning/brainstorming skills
- upstream-source-research new rule: always by default set systemd timer or equivalent to cleanup big tmp folder of downloaded sources after 2h. This should be done always in case user will miss the report and forget to cleanup. He will be able to ask you to drop this timer if he will want to preserve the folder
