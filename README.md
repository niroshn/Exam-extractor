# Handwritten Exam Script Extraction MVP

A production-minded web service designed for high-fidelity extraction and transcription of multi-page handwritten student examination scripts.

The system transcribes student handwriting with strict fidelity—preserving grammatical mistakes, original spelling, crossed-out content (`<strikethrough>`), caret insertions (`<caret>`), paragraph boundaries (`\n\n`), and associating extracted responses with specific examination questions.

---

## 1. Architecture

```text
                    ┌───────────────────┐
                    │   POST /extract   │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ Input Validation  │ (Max 10 files, Max 25MB, Unique Names)
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │   PDF → Images    │ (PyMuPDF @ 200 DPI Rendering)
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │   Vision LLM      │ (Strict Fidelity Transcriber)
                    │  (Gemini 3.7)     │ • Strikethrough (<strikethrough>)
                    │                   │ • Caret Insertion (<caret>)
                    │                   │ • Literal spelling & grammar
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ Pydantic Validate │ (Structured PageTranscription)
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │   Combine Pages   │ (Order preservation across pages)
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ Question Matching │ (1. Explicit No. -> 2. Text -> 3. Semantic)
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │   Final JSON      │ (Preserves input question ordering & nulls)
                    └───────────────────┘
```

---

## 2. Setup & Installation

### Local Python Environment

```bash
# 1. Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env and supply GEMINI_API_KEY
```

### Run Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Docker

```bash
docker build -t exam-extractor .
docker run -p 8000:8000 -e GEMINI_API_KEY="your-api-key" exam-extractor
```

---

## 3. API Contract

### `POST /extract`

- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `files`: One or more PDF files (`application/pdf`), max 10 files, max 25MB per PDF.
  - `questions`: JSON array or newline-delimited list of question strings.

#### Example Request (`curl`)

```bash
curl -X POST "http://localhost:8000/extract" \
  -F "files=@student_001.pdf" \
  -F "files=@student_002.pdf" \
  -F 'questions=["6. Some strategies for building community resilience to earthquakes are more effective than others. To what extent do you agree?","Q7. Discuss coastal management techniques."]'
```

#### Example Response (`200 OK`)

```json
{
  "results": [
    {
      "filename": "student_001.pdf",
      "responses": [
        {
          "question": "6. Some strategies for building community resilience to earthquakes are more effective than others. To what extent do you agree?",
          "response": "Strategies in building community resilience to earthquakes is important for communities living in hazard prone places. These strategies include reducing exposure through land-use planning and reducing vulnerability through monitoring and warning systems. However, I strongly <strikethrough>disagree</strikethrough> believe that monitoring and warning systems is more <caret>substantially</caret> effective than land-use planning."
        },
        {
          "question": "Q7. Discuss coastal management techniques.",
          "response": null
        }
      ]
    }
  ]
}
```

---

## 4. Design Decisions: Vision LLM vs Traditional OCR

| Capability | Traditional OCR (Tesseract / EasyOCR) | Vision LLM (Gemini 3.7 Flash) |
|---|---|---|
| **Cursive & Messy Handwriting** | Low accuracy; character confusion | High holistic linguistic context |
| **Crossed-out Text Detection** | Treats strikes as noise/corrupted glyphs | Explicitly identifies strikethroughs with `<strikethrough>` tags |
| **Caret Insertion (`^`)** | Dislocates inserted floating text into separate line | Re-inserts text into the correct syntactical sentence position (`<caret>`) |
| **Paragraph vs Line Breaks** | Inserts `\n` on every visual margin wrap | Disambiguates true paragraph breaks (`\n\n`) from natural writing wrapping |
| **Spelling / Grammar Fidelity** | Prone to false autocorrect or junk tokens | Strict system prompt guarantees zero autocorrection |

---

## 5. Limitations

- **Probabilistic Caret Resolution**: In cases where handwriting contains multiple ambiguous arrows or caret marks pointing across margins, resolution is probabilistic and relies on layout proximity.
- **Extreme Overwriting**: If a student writes heavily over previous text multiple times, the underlying text may be classified as `[UNCLEAR]`.
- **DPI Dependency**: Scans below 150 DPI may degrade character stroke discernment for faint pencil marks. 200–300 DPI is recommended.

---

## 6. Production Improvements

1. **Asynchronous Task Queue (AWS SQS / Celery + Redis)**: Decouple large batch uploads into asynchronous jobs returning a `task_id` for status polling and webhook notification.
2. **Object Storage (Amazon S3 / Google Cloud Storage)**: Store uploaded PDFs temporarily in encrypted buckets with short-lived presigned URLs and automatic lifecycle expiration (TTL: 1 hour).
3. **Worker Fleet Autoscaling (AWS ECS / Cloud Run)**: Horizontally scale extraction workers according to queue depth.
4. **Authentication & RBAC**: Integrate OAuth 2.0 / JWT authorization with role-based access for examiners and institutions.
5. **PII Redaction & Audit Logging**: Automatic masking of student names and candidate IDs prior to vision processing, combined with immutable audit logs.
# Exam-extractor
