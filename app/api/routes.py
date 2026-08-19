import asyncio
import time
import uuid
import logging
from typing import List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from app.config import settings
from app.models import ExtractionResponse, FileResult
from app.utils.validation import validate_upload_files, parse_and_validate_questions
from app.services.pdf_service import PDFService
from app.services.vision_service import GeminiVisionExtractor
from app.services.question_service import QuestionMatchingService
from app.services.extraction_service import ExtractionService

logger = logging.getLogger("api.routes")
router = APIRouter()

# Controlled concurrency semaphore
extraction_semaphore = asyncio.Semaphore(settings.MAX_CONCURRENT_EXTRACTIONS)

pdf_service = PDFService()
vision_extractor = GeminiVisionExtractor()
question_service = QuestionMatchingService()
extraction_service = ExtractionService(vision_extractor, question_service)


@router.post(
    "/extract",
    response_model=ExtractionResponse,
    status_code=status.HTTP_200_OK,
    summary="Extract handwritten examination scripts",
    description="Accepts multi-page PDF scans and a list of examination questions, returning faithful transcriptions with caret insertions and strikethroughs preserved."
)
async def extract_examination_scripts(
    files: List[UploadFile] = File(..., description="One or more PDF examination script scans (max 10, max 25MB each)"),
    questions: str = Form(..., description="JSON array of examination questions or newline-separated questions")
):
    request_id = str(uuid.uuid4())
    start_time = time.time()
    
    # 1. Validation
    validate_upload_files(files)
    question_list = parse_and_validate_questions(questions)
    
    logger.info(
        f"[ReqID: {request_id}] Starting extraction for {len(files)} files and {len(question_list)} questions."
    )

    async def process_single_file(file: UploadFile) -> FileResult:
        file_start = time.time()
        async with extraction_semaphore:
            file_bytes = await file.read()
            # 2. PDF rendering
            pages_data = pdf_service.render_pdf_bytes_to_images(file_bytes, file.filename)
            page_count = len(pages_data)
            
            # 3. Vision Extraction + Question Matching
            llm_start = time.time()
            result = await extraction_service.process_script(
                filename=file.filename,
                pages_data=pages_data,
                questions=question_list
            )
            llm_duration = time.time() - llm_start
            total_file_duration = time.time() - file_start

            # Structured logging ONLY (No student responses or exam content logged)
            logger.info(
                f"[ReqID: {request_id}] file='{file.filename}' pages={page_count} "
                f"llm_time={llm_duration:.2f}s total_time={total_file_duration:.2f}s status=success"
            )
            return result

    try:
        tasks = [process_single_file(f) for f in files]
        results = await asyncio.gather(*tasks)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ReqID: {request_id}] Extraction pipeline failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during examination script extraction."
        )

    total_duration = time.time() - start_time
    logger.info(f"[ReqID: {request_id}] Completed all extractions in {total_duration:.2f}s.")

    return ExtractionResponse(results=results)
