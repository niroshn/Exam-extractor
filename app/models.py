from typing import Optional, List
from pydantic import BaseModel, Field


class ResponseItem(BaseModel):
    question: str = Field(..., description="The exact question string as provided in the input list")
    response: Optional[str] = Field(None, description="The faithfully extracted student response, or null if unanswered")


class FileResult(BaseModel):
    filename: str = Field(..., description="The original filename of the student PDF script")
    responses: List[ResponseItem] = Field(..., description="Extracted student responses ordered to match the input questions")


class ExtractionResponse(BaseModel):
    results: List[FileResult] = Field(..., description="Results for all processed student examination scripts")


class PageExtraction(BaseModel):
    page: int = Field(..., description="1-indexed page number")
    text: str = Field(..., description="Faithfully transcribed text for the page")
    question_hints: List[str] = Field(default_factory=list, description="Any detected explicit question markers (e.g. 'Q1', '6')")
    confidence: Optional[float] = Field(default=None, description="Optional internal transcription confidence metric")


class QuestionMatchResult(BaseModel):
    matched_question: Optional[str] = Field(None, description="The exact matching question string from the input list")
    match_type: str = Field("none", description="Matching strategy used: 'explicit_number', 'explicit_text', 'semantic', or 'none'")
    confidence: float = Field(1.0, description="Confidence score of the match")
