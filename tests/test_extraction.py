import pytest
from unittest.mock import AsyncMock, MagicMock
from app.services.extraction_service import ExtractionService
from app.models import PageExtraction, ResponseItem


class MockVisionExtractor:
    def __init__(self, pages_responses):
        self.pages_responses = pages_responses

    async def extract_page(self, page_num: int, image_bytes: bytes) -> PageExtraction:
        text = self.pages_responses.get(page_num, "")
        return PageExtraction(page=page_num, text=text, confidence=0.98)


class MockQuestionService:
    async def identify_question(self, student_text: str, questions: list[str], hints: list[str] = None):
        from app.models import QuestionMatchResult
        for q in questions:
            # simple mock match
            if q.startswith("6.") and ("earthquakes" in student_text.lower() or "6." in student_text):
                return QuestionMatchResult(matched_question=q, match_type="explicit_number", confidence=1.0)
            if "Q1" in q and ("Q1" in student_text or "photosynthesis" in student_text.lower()):
                return QuestionMatchResult(matched_question=q, match_type="explicit_number", confidence=1.0)
            if "Q2" in q and "Q2" in student_text:
                return QuestionMatchResult(matched_question=q, match_type="explicit_number", confidence=1.0)
        return QuestionMatchResult(matched_question=None, match_type="none", confidence=0.0)

    async def match_semantically(self, student_text: str, questions: list[str]):
        from app.models import QuestionMatchResult
        return QuestionMatchResult(matched_question=None, match_type="none", confidence=0.0)


@pytest.mark.asyncio
async def test_fidelity_spelling_and_grammar_preservation():
    """Verifies that spelling errors like 'nervus' and grammar like 'systems is' are not corrected."""
    mock_pages = {
        1: "6.\nStrategies in building community resilience to earthquakes is important for communities living in hazard prone places.\n\nThe candidate felt nervus excited."
    }
    extractor = MockVisionExtractor(mock_pages)
    q_service = MockQuestionService()
    extraction_service = ExtractionService(extractor, q_service)
    
    questions = [
        "6. Some strategies for building community resilience to earthquakes are more effective than others."
    ]
    
    result = await extraction_service.process_script("student_001.pdf", [(1, b"fake_png")], questions)
    
    assert len(result.responses) == 1
    resp_text = result.responses[0].response
    # Must preserve 'nervus' and 'is important'
    assert "nervus" in resp_text
    assert "nervous" not in resp_text
    assert "is important" in resp_text


@pytest.mark.asyncio
async def test_fidelity_strikethrough_and_caret_preservation():
    """Verifies that <strikethrough> and <caret> tags are faithfully retained."""
    mock_pages = {
        1: "6.\nI strongly <strikethrough>disagree</strikethrough> agree with this statement.\n\nShe walked <caret>slowly</caret> towards the epicenter."
    }
    extractor = MockVisionExtractor(mock_pages)
    q_service = MockQuestionService()
    extraction_service = ExtractionService(extractor, q_service)
    
    questions = [
        "6. Some strategies for building community resilience to earthquakes are more effective than others."
    ]
    
    result = await extraction_service.process_script("student_002.pdf", [(1, b"fake_png")], questions)
    
    resp_text = result.responses[0].response
    assert "<strikethrough>disagree</strikethrough>" in resp_text
    assert "<caret>slowly</caret>" in resp_text


@pytest.mark.asyncio
async def test_multi_page_concatenation():
    """Verifies that answers spanning multiple pages are concatenated into a single response."""
    mock_pages = {
        1: "6.\nStrategies in building community resilience to earthquakes include reducing exposure through land-use planning.",
        2: "Furthermore, monitoring and warning systems provide vital preparation time for residents.",
        3: "Therefore, early warning systems are more crucial than zoning regulations."
    }
    extractor = MockVisionExtractor(mock_pages)
    q_service = MockQuestionService()
    extraction_service = ExtractionService(extractor, q_service)
    
    questions = [
        "6. Some strategies for building community resilience to earthquakes are more effective than others."
    ]
    
    result = await extraction_service.process_script(
        "student_multi_page.pdf",
        [(1, b"p1"), (2, b"p2"), (3, b"p3")],
        questions
    )
    
    assert len(result.responses) == 1
    resp_text = result.responses[0].response
    assert "land-use planning" in resp_text
    assert "monitoring and warning systems" in resp_text
    assert "early warning systems" in resp_text


@pytest.mark.asyncio
async def test_missing_question_preservation():
    """Verifies that unanswered questions return response: None and preserve list order."""
    mock_pages = {
        1: "Q1.\nPhotosynthesis occurs in chloroplasts."
    }
    extractor = MockVisionExtractor(mock_pages)
    q_service = MockQuestionService()
    extraction_service = ExtractionService(extractor, q_service)
    
    questions = [
        "Q1. Describe the location of photosynthesis.",
        "Q2. Explain the role of ATP synthase in cellular respiration.",
        "Q3. Detail the light-independent reactions."
    ]
    
    result = await extraction_service.process_script("student_partial.pdf", [(1, b"p1")], questions)
    
    assert len(result.responses) == 3
    assert result.responses[0].question == questions[0]
    assert result.responses[0].response is not None
    assert "chloroplasts" in result.responses[0].response
    
    # Q2 and Q3 must be explicitly null
    assert result.responses[1].question == questions[1]
    assert result.responses[1].response is None
    
    assert result.responses[2].question == questions[2]
    assert result.responses[2].response is None
