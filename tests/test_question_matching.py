import pytest
from unittest.mock import MagicMock
from app.services.question_service import QuestionMatchingService
from app.models import QuestionMatchResult


@pytest.fixture
def question_service():
    service = QuestionMatchingService(api_key="fake-key")
    return service


def test_explicit_number_matching(question_service):
    questions = [
        "1. Explain the mechanism of plate tectonics.",
        "2. Discuss the causes of coastal erosion.",
        "6. Some strategies for building community resilience to earthquakes..."
    ]
    
    # Student text starts with "6."
    student_text = "6. Strategies in building community resilience to earthquakes is important..."
    matched = question_service.match_by_explicit_number(student_text, questions)
    assert matched == questions[2]
    
    # Student text starts with "Q2."
    student_text2 = "Q2. Coastal erosion is primarily caused by hydraulic action."
    matched2 = question_service.match_by_explicit_number(student_text2, questions)
    assert matched2 == questions[1]


def test_explicit_text_matching(question_service):
    questions = [
        "Q1. Describe the key characteristics of cellular respiration in mitochondria.",
        "Q2. Explain Newton's third law of motion with examples."
    ]
    
    # Student text doesn't have Q1, but quotes/repeats "Describe the key characteristics"
    student_text = "Describe the key characteristics of cellular respiration: First, glycolysis occurs..."
    matched = question_service.match_by_explicit_text(student_text, questions)
    assert matched == questions[0]


@pytest.mark.asyncio
async def test_semantic_matching_fallback(question_service):
    questions = [
        "1. What are the economic impacts of inflation?",
        "2. How does gravity affect orbital trajectories?"
    ]
    
    # Mock LLM client response for semantic matching
    mock_response = MagicMock()
    mock_response.text = '{"matched_question": "1. What are the economic impacts of inflation?", "match_type": "semantic", "confidence": 0.92}'
    question_service.client.models.generate_content = MagicMock(return_value=mock_response)
    
    student_text = "When purchasing power decreases rapidly, consumers tend to reduce discretionary spending."
    result = await question_service.identify_question(student_text, questions)
    
    assert result.matched_question == questions[0]
    assert result.match_type == "semantic"
