---
description: >-
  General-purpose agent for researching complex questions and executing multi-step tasks
  with expanded permissions. Use this agent to execute multiple units of work in parallel.
  For yolo mode.
mode: subagent
color: success
permission:
  "*": allow
  question: deny
  task: deny
  todowrite: deny
  read:
    "*": allow
  bash:
    "*": allow
  edit:
    "*": allow
  external_directory:
    "*": allow
---
