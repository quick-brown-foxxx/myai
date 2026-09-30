---
name: api-contracts
description: >-
  Choose the single source of truth for an API contract and keep it from drifting: shared
  runtime schemas when both sides run the same stack, or an OpenAPI document when the API
  crosses languages, repositories, or trust boundaries. Use when defining a frontend/backend
  boundary, sharing transport DTOs, generating clients, choosing between OpenAPI and shared
  schemas or types, or deciding what actually validates data on the wire.
metadata:
  tags: domain, architecture, boundaries
---

# API Contracts

## Overview

A contract is the interface between two systems. It must survive the wire, and it must
have exactly one owner. Compile-time types alone cannot do this: they are erased before
runtime, so they never validate a real payload. Pick one authoritative artifact, derive
everything else from it, and validate at the boundary.

Workflow map:

```text
architecting-changes  -> api-contracts  -> api-design            (endpoint, error, pagination details)
                                        -> building-backends     (backend architecture)
                                        -> setting-up-backends   (backend/API bootstrap)
                                        -> architecting-test-infra (contract-powered test servers)
```

## Decision

Decide by the boundary, not by habit.

| Situation | Source of truth | Derived artifacts |
| --- | --- | --- |
| Same language and stack on both sides, one repo or one shared package | Shared runtime schemas / typed model package | Inferred types, validators, test fixtures |
| Cross-boundary API, backend you own | Annotated endpoint code (generates the OpenAPI document) | Generated OpenAPI document, then generated clients, types, validators, mock servers |
| Cross-boundary API, external or contract-first | Given OpenAPI document | Generated clients, types, validators, mock servers |

- **Share runtime schemas when** both sides run the same stack and can consume one
  contract package. Shortest path: one package owns the schema, both sides import it, and
  types are inferred from it.
- **Use OpenAPI when** the API crosses a language, repository, or trust boundary, or is
  consumed by clients you do not control. OpenAPI is language-neutral, so the document is
  the durable interface — but the document is itself a derived artifact:
  - **Backend you own:** annotate handlers and DTOs and let the framework generate the
    document (code-first, e.g. FastAPI or NestJS). Never hand-write the YAML.
  - **Externally owned or contract-first API:** take the given document and generate
    typed, validating schemas for your language from it.

Either way keep a typed validating layer — shared schemas or generated validators, never
raw JSON passed around on trust.

### Shared schemas (same stack)

```typescript
// TypeScript — one schema, types inferred from it; both sides import this.
import { z } from 'zod';

export const CreateTask = z.object({
  title: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});
export type CreateTask = z.infer<typeof CreateTask>;
```

```python
# Python — a pydantic model is both the runtime validator and the type source.
from typing import Literal
from pydantic import BaseModel, Field

class CreateTask(BaseModel):
    title: str = Field(min_length=1)
    priority: Literal["low", "medium", "high"] = "medium"
```

### OpenAPI generated from annotated endpoints (cross-boundary)

```python
# FastAPI — pydantic models and type hints define the schema; the OpenAPI
# document is generated from them. No YAML is written by hand.
from typing import Literal
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI()

class CreateTask(BaseModel):
    title: str = Field(min_length=1)
    priority: Literal["low", "medium", "high"] = "medium"

class Task(CreateTask):
    id: str

@app.post("/tasks", response_model=Task, status_code=201)
def create_task(payload: CreateTask) -> Task:
    ...  # payload is validated before this body runs; /openapi.json is generated
```

```typescript
// NestJS — class-validator DTOs plus @nestjs/swagger decorators generate the
// OpenAPI document. No YAML is written by hand.
import { Body, Controller, Post } from '@nestjs/common';
import { ApiProperty, ApiCreatedResponse } from '@nestjs/swagger';
import { IsIn, IsString, MinLength } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiProperty({ enum: ['low', 'medium', 'high'], default: 'medium' })
  @IsIn(['low', 'medium', 'high'])
  priority: 'low' | 'medium' | 'high' = 'medium';
}

export class TaskDto extends CreateTaskDto {
  @ApiProperty() id!: string;
}

@Controller('tasks')
export class TasksController {
  @Post()
  @ApiCreatedResponse({ type: TaskDto })
  create(@Body() payload: CreateTaskDto): Promise<TaskDto> { ... }
}
```

### Validating layer (always)

With OpenAPI, generate typed validating schemas and clients for each consuming language
(`orval`, `openapi-typescript`, a zod/openapi generator, or the equivalent). Better not
hand-write DTOs from the document, and never trust raw JSON:

```typescript
// Generated from the OpenAPI document — never hand-edited.
import { CreateTask } from './generated/schemas'; // runtime validator
import type { components } from './generated/types';

const parsed = CreateTask.safeParse(req.body); // validates on the wire
if (!parsed.success) return res.status(422).json({ error: 'VALIDATION_ERROR' });

const task: components['schemas']['Task'] = await taskService.create(parsed.data);
```

When to hand write validation: no suitable library for generating, or severe bugs/limitations encountered, or yaml schema is not expected to ever change (eg super stable third party API), or no openapi is available.

## Rules

- The server validates every external input, whoever else validates it. Client-side
  validation is UX and early feedback, never authorization or integrity.
- Never hand-write the OpenAPI document. Generate it from annotated backend code, or
  accept the given external document as-is. Never maintain annotations, shared schemas,
  and handwritten DTOs as independent truths.
- Generate every derived artifact — clients, types, validators, docs, test fixtures. Never hand-edit generated files. Use hand-written artifacts only as the last resort solution.
- Share transport DTOs only. Do not expose backend domain models, persistence entities, or
  use-case inputs just because both sides share a language.
- Validate the payload after it crosses the boundary, even when a generated schema exists.
  Always keep a typed validating layer — shared schemas or generated validators, never raw
  JSON on trust.

## Routing

- Endpoint shape, error format, pagination, naming: `api-design`.
- Backend layering, transport vs. domain separation: `building-backends`.
- Backend service bootstrap and OpenAPI generation tooling: `setting-up-backends`.
- Contract-powered test servers and fixtures: `architecting-test-infra`,
  `high-level-testing-strategy`.
- Boundary placement and frontend/backend split: `architecting-changes`.
- Language-level coding patterns: the relevant language coding skill.
