from fastapi import HTTPException, UploadFile, status
from typing import List
import json
from app.config import settings


def validate_upload_files(files: List[UploadFile]) -> None:
    if not files or len(files) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one PDF file must be provided."
        )
    
    if len(files) > settings.MAX_FILES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Too many files uploaded. Maximum allowed is {settings.MAX_FILES} files."
        )

    filenames = set()
    for file in files:
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is missing a filename."
            )
        
        lower_name = file.filename.lower()
        if not lower_name.endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type for '{file.filename}'. Only PDF files are supported."
            )
        
        if file.filename in filenames:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Duplicate filename '{file.filename}'. All uploaded filenames must be unique."
            )
        filenames.add(file.filename)


def parse_and_validate_questions(questions_raw: str | List[str]) -> List[str]:
    if isinstance(questions_raw, list):
        questions = [q.strip() for q in questions_raw if q.strip()]
    elif isinstance(questions_raw, str):
        try:
            parsed = json.loads(questions_raw)
            if isinstance(parsed, list):
                questions = [str(q).strip() for q in parsed if str(q).strip()]
            else:
                questions = [line.strip() for line in questions_raw.splitlines() if line.strip()]
        except json.JSONDecodeError:
            questions = [line.strip() for line in questions_raw.splitlines() if line.strip()]
    else:
        questions = []

    if not questions:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The 'questions' list cannot be empty."
        )

    return questions
