# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A high-fidelity extraction/transcription service for handwritten, multi-page student examination scripts. Given PDF scans and a list of exam questions, it transcribes each student's handwriting with strict fidelity (no autocorrect, no grammar fixes), preserves crossed-out text as `<strikethrough>...</strikethrough>` and caret insertions as `<caret>...</caret>`, and matches transcribed responses to the correct question via a 3-tier strategy (explicit question number → explicit question text → semantic LLM matching).

**The repo contains two independent, parallel implementations of this same pipeline** — keep this in mind before editing either one in isolation:

1. **`app/` — Python/FastAPI backend.** The production-minded implementation described in `README.md`. This is the canonical `POST /extract` service.
2. **`server.ts` + `src/` — TypeScript/Express/React demo app.** A self-contained Google AI Studio applet that reimplements the *same* transcription prompt, question-matching logic, and `/extract` contract natively in TypeScript (inside `server.ts`), plus a React UI for uploading scripts, viewing results, and exploring the Python codebase/tests from the browser.

Because the transcription system prompt, question-matching prompt, and matching algorithm are duplicated between `app/prompts.py`/`app/services/question_service.py` and the top of `server.ts`, a change to fidelity rules or matching behavior in one place generally needs to be mirrored in the other unless the task is explicitly scoped to just one side.

## Commands

### TypeScript/React app (server.ts + src/, run with Bun or npm)

```bash
npm install        # or: bun install
npm run dev         # tsx server.ts — runs Express + Vite middleware on :3000
npm run build        # vite build (client) + esbuild bundle of server.ts -> dist/server.cjs
npm run start        # node dist/server.cjs — serve the production build
npm run lint         # tsc --noEmit
npm run clean         # rm -rf dist server.js
```

There is no JS/TS test runner configured (no `test` script, no test files under `src/`).

### Python/FastAPI backend (app/)

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then set GEMINI_API_KEY

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000   # run the API
pytest                                                       # run all tests
pytest tests/test_extraction.py                              # single test file
pytest tests/test_api.py::test_extract_invalid_file_extension  # single test
```

## Environment

Both the Python backend and the TypeScript server read `GEMINI_API_KEY` from `.env` (loaded via `pydantic-settings` on the Python side, `dotenv` on the TS side). The Python side also honors `AI_MODEL`, `MAX_FILE_SIZE_MB`, `MAX_FILES`, `PDF_DPI`, and `MAX_CONCURRENT_EXTRACTIONS` (see `app/config.py`); the TS side hardcodes the equivalent constants (`gemini-3.7-flash`, 25MB/10 files, concurrency 5) directly in `server.ts`.

## Architecture (Python backend, `app/`)

Request flow for `POST /extract` (`app/api/routes.py`):

1. **Validation** (`app/utils/validation.py`) — file count/size/extension/uniqueness, and `questions` parsing (accepts JSON array or newline-delimited string).
2. **PDF → images** (`app/services/pdf_service.py`) — PyMuPDF renders each page to PNG at `PDF_DPI` (default 200).
3. **Vision extraction** (`app/services/vision_service.py`) — `GeminiVisionExtractor` sends each page image individually to Gemini with `TRANSCRIPTION_SYSTEM_PROMPT` (`app/prompts.py`), temperature 0, expecting structured JSON (`PageExtraction`: page, text, question_hints, confidence). Retries up to 2x on failure.
4. **Question matching + assembly** (`app/services/extraction_service.py`) — `ExtractionService.process_script`:
   - Splits each page's transcribed text into blocks on question-header boundaries (regex for `Q1`, `Question 1`, `6.`, etc. — see `split_page_into_question_blocks`).
   - For each block, runs `QuestionMatchingService.identify_question` (`app/services/question_service.py`), which tries, in order: explicit question number → explicit question text substring → semantic LLM match (`QUESTION_MATCHING_PROMPT`).
   - Accumulates matched text fragments per question, carrying the "current matched question" forward across blocks/pages that lack their own header (handles multi-page answers with no repeated header).
   - Final assembly joins fragments per question with `\n\n` and always returns every input question in original order, with `response: null` for unanswered ones.
5. Files are processed concurrently across an `asyncio.Semaphore(MAX_CONCURRENT_EXTRACTIONS)`.

`app/main.py` wires up the FastAPI app: permissive CORS, a global exception handler that never leaks internals, `/health`, and the `/extract` router. Request-level logging never logs extracted student content — only filenames/timings/status.

## Architecture (TypeScript demo app)

- `server.ts` is a single-file Express server: Multer handles multipart upload (memory storage, same 10-file/25MB limits), then `processSinglePdfScript` sends the **entire PDF** as inline data to Gemini in one call (unlike the Python side, which renders and sends per-page images), parses the JSON response into `pages`, and runs the same explicit-number → explicit-text → semantic three-tier matching (`matchQuestionToResponse`, `splitIntoQuestionBlocks`) inline in the same file. It also exposes `/api/samples` (canned example scripts for the UI), `/api/run-tests` (a hardcoded/simulated test report, not real pytest output), and `/api/python-codebase` (reads the `app/`/`tests/` source files off disk so the React UI can display them).
- In dev, Express mounts Vite in middleware mode (`createViteServer({ server: { middlewareMode: true } })`) to serve `src/` with HMR; in production it serves the built `dist/` static assets and falls back to `index.html` for SPA routing.
- `src/App.tsx` is a tabbed shell (`extractor` / `viewer` / `tests` / `api` / `codebase`) switching between `ExtractionUploader`, `ExaminerViewer`, `TestSuiteViewer`, `ApiPlayground`, and `PythonCodebaseViewer` — the latter two exist specifically to let a user inspect the "real" Python implementation and its test suite from within the demo UI, backed by the `/api/python-codebase` endpoint above.
- Path alias `@/*` → repo root (configured in both `tsconfig.json` and `vite.config.ts`).
