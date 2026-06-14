# my commands

Below are prompt templates that I use daily when I interact with Orchestrator for 80% of normal classic tasks (research-code-verify). So I want to convert them into reusable commands/skills instead of copy-paste prompts.

Those commands will be invoked by me manually when working with orchestrator, or by teamlead when it runs the team, in that case every command goes to a particular teammate. So in case of a team, teamlead will do the same things that I do now with single orchestrator.

Those prompt templates form the `mega-workflow`. But they are not 100% of it, other parts (commands/steps) should be added later during ideation/brainstorming process.

## after interactive brainstorm/triage: write plan and implement

```
Now write the low level implementation plan. and than implement fully.

{{ IF_PLAN_NOT_FULLY_COVERS_TESTS }}

Check tests coverage. New features should be covered with unit/e2e tests, and/or we need to update existing tests. Spawn subagent to think about test cases using {{ RELEVANT_DOCS_OR_SKILLS }}. 

{{ ENDIF_PLAN_NOT_FULLY_COVERS_TESTS }}

Consider dependencies/order of implementation for big tasks you will have. Spawn subagents in order that WILL NOT CAUSE CONFLICTS or race. Ensure that all artifacts required by a particular agent already exist/created by previous agents and not created concurrently.

{{ IF_TASK_HAS_HIGH_AMBIGUITY_LEVEL }}

For implementing ambiguous/complex/new features or fixing naughty/big/architectural bugs, prefer to spawn researcher/prototyper agent/teammate first. It should test different implementation strategies, adjust environment if needed and report final working solution and additional stuff it learned. Only after this proceed to real code implementation. How to understand if a steps needs prototyping: it relies on complex modifications that may potentially collapse; or it relies on interacting with multiple flaky subsystems/libs/packages; or if you are fixing a bug and it already required several attempts and is not yet fixed. So - anything that may lead to stepping away from initial plan is better to prototype first and update the plan than to do a hoc patches later in rush.

{{ ENDIF_TASK_HAS_HIGH_AMBIGUITY_LEVEL }}

Use /planning-implementation to create one and /executing-plans-with-subagents once it's ready. You MUST create a todo list to control plan implementation.

{{ IF_PROJECT_CAN_BE_TESTED_MANUALLY }}

After main work is done, for complex features run manual testing subagent/teammate (or multiple if multiple big features) or one agent/teammate for multiple small features. They should verify features work. They should work with full real setup - real project, {{ REAL_SETUP_DESCRIPTION }}. Fix problems if any.

{{ HOW_TO_SETUP_FULL_REAL_PROJECT_FOR_TESTING }}

{{ ENDIF_PROJECT_CAN_BE_TESTED_MANUALLY }}

After fixes are done, spawn one/multiple (if lot's of changes) code reviewers/business logic checkers with different scopes, use  /verification-before-completion to check if code adheres to plan and project standards and rules.

Linter and typecheck should be green, all tests should pass. {{ LINTER_AND_TESTS_ADDITIONAL_NOTES }}.

Note that you may need to do Verify → Fix → Re-verify loop, cause issues will uncover progressively. This is ok, never consider work done after first single verification-fix run.

You are free to make architectural decisions, update environment and so on.

After this point, your goal is to finish this work to result. Don't ask me clarification questions unless absolutely needed, rely on other docs and philosophies when making decisions.

Excessively use subagents, teammates and skills, don't do raw work yourself, be high level orchestrator. Medium/big task/subtask -> subagent. Only small interactions are on you directly.

Remember to commit from time to time.

Good luck!

Update AGENTS.md when done.
```

## code review for a task

```txt
{{ DOCS_AND_REFERENCES }}

We are working on {{ TASK }}.

We must do big check of current work: logic consistence, compliance with initial spec, plan implementation correctness, code review, alignment with project rules, business logic review and so on.

{{ OTHER_REVIEW_AREAS }}

Also check tests coverage using  test rules. 

{{ TEST_RULES }}

SPECIAL FOCUS: test review should consider wether given tests really test smth meaningful, and not just produce green checkmarks by validating mocked internal implementation details. Tests should focus on meaningful contract/behavior validation instead. AI generated tests are very likely to have this problem!

Also focus on real manual e2e testing of locally launched api/web via frontend (chrome) and/or api (temp python+pep723+uv scripts), depending of the task scope.

{{ HOW_TO_START_FULL_PROJECT }}

Use teammates/subagents with different scopes and prompts.

{{ IF_BIG_OR_SPAGHETTI_PROJECT }}

OUT OF SCOPE: this project is very complex and big and contains interconnected spaghetti-code. If validators will find issues in files that are not close to files affected by MR, lower those issues priority and list them with a note. We are not able to do full fix of everything in one MR. But if such low-related issues break main critical requirements, contracts and flows, treat them like in-scope problems.

{{ ENDIF_BIG_OR_SPAGHETTI_PROJECT }}

Implementors claimed they are done, lint/tsc/tests are green for this task but I am not sure this is true

DO NOT APPLY FIXES YET
```

## triage of found issues

```
okay.

let's proceed to triage and fixes

now your goal is to spawn couple of triage agents, with different priorities/logic/focus, feed them all important docs and context and compare their suggestions. than create a fix plan and todo, proceed, fix everything that you will pick in triage.

scope: {{ SCOPE }}
type of issues to fix: real bugs, typing/arch problems, tests coverage, uncovered features, docs
max priority: features that are not yet properly tested or that are skipped in tests. 90% chance that they don't work at all
low priority: refactorings that do not relate to other issues or problems {{ ADDITIONAL PRIORITY }}
effort level: high but not "max-effort-clean-everything-possible"
```
