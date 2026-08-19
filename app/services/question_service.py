import re
import json
import logging
from typing import List, Optional
from google import genai
from google.genai import types
from app.config import settings
from app.models import QuestionMatchResult
from app.prompts import QUESTION_MATCHING_PROMPT

logger = logging.getLogger("question_service")


class QuestionMatchingService:
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.AI_API_KEY
        self.model = model or settings.AI_MODEL
        self.client = genai.Client(api_key=self.api_key)

    def extract_question_number_from_text(self, text: str) -> Optional[str]:
        """Looks for leading patterns like 'Q1', 'Qn1', 'Question 1', '6.', '1)', 'Task 2'."""
        patterns = [
            # Keyword-prefixed markers, trailing punctuation optional (e.g. 'Q2', 'Qn2', 'Question 2', 'Q.2', 'Task 3')
            r"^\s*(?:Question|Qtn|Qn|Task|Section)\.?\s*([0-9]+|[A-Za-z])\b",
            r"^\s*Q\.?\s*([0-9]+|[A-Za-z])\b",
            # Bare leading number requiring punctuation, to avoid matching ordinary sentences (e.g. '6.', '1)')
            r"^\s*([0-9]+)\s*[\.\:\)]",
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None

    def match_by_explicit_number(self, student_text: str, questions: List[str], hints: List[str] = None) -> Optional[str]:
        # Check text or hints
        candidates = []
        if hints:
            for h in hints:
                num = self.extract_question_number_from_text(h)
                if num:
                    candidates.append(num)

        lead_num = self.extract_question_number_from_text(student_text)
        if lead_num:
            candidates.append(lead_num)

        for candidate in candidates:
            for q in questions:
                # Match question leading number
                q_num = self.extract_question_number_from_text(q)
                if q_num and q_num.lower() == candidate.lower():
                    return q
        return None

    def match_by_explicit_text(self, student_text: str, questions: List[str]) -> Optional[str]:
        cleaned_response = re.sub(r"<[^>]+>", "", student_text).lower()
        for q in questions:
            # Check if substantial phrase of question (>= 15 chars) is quoted/repeated in response
            q_clean = re.sub(r"^\s*(?:Question|Q\.?|Task)?\s*[0-9]+[\.\:\)\-]\s*", "", q, flags=re.IGNORECASE).strip().lower()
            if len(q_clean) > 15:
                # Check for 3-5 word key substring match
                words = q_clean.split()
                if len(words) >= 4:
                    phrase = " ".join(words[:4])
                    if phrase in cleaned_response:
                        return q
        return None

    async def match_semantically(self, student_text: str, questions: List[str]) -> QuestionMatchResult:
        """Fallback to semantic LLM matching."""
        if not student_text or not student_text.strip():
            return QuestionMatchResult(matched_question=None, match_type="none", confidence=0.0)

        questions_formatted = "\n".join([f"- {q}" for q in questions])
        prompt = QUESTION_MATCHING_PROMPT.format(questions=questions_formatted, response=student_text)

        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.0
                )
            )
            raw_text = response.text or "{}"
            if raw_text.startswith("```"):
                raw_text = raw_text.strip("`").replace("json\n", "", 1).strip()
            
            data = json.loads(raw_text)
            matched_q = data.get("matched_question")
            
            # Ensure matched question is an exact member of input questions
            if matched_q and matched_q in questions:
                return QuestionMatchResult(
                    matched_question=matched_q,
                    match_type=data.get("match_type", "semantic"),
                    confidence=data.get("confidence", 0.9)
                )
            # Check if trimmed or close
            if matched_q:
                for orig_q in questions:
                    if matched_q.strip() == orig_q.strip() or orig_q.startswith(matched_q):
                        return QuestionMatchResult(
                            matched_question=orig_q,
                            match_type="semantic",
                            confidence=0.85
                        )
        except Exception as e:
            logger.error(f"Semantic question matching error: {e}")

        return QuestionMatchResult(matched_question=None, match_type="none", confidence=0.0)

    async def identify_question(self, student_text: str, questions: List[str], hints: List[str] = None) -> QuestionMatchResult:
        """
        Executes the 3-priority matching strategy:
        1. Explicit question number
        2. Explicit question text
        3. Semantic matching
        """
        if not student_text or not student_text.strip():
            return QuestionMatchResult(matched_question=None, match_type="none", confidence=0.0)

        # 1. Explicit question number
        num_match = self.match_by_explicit_number(student_text, questions, hints)
        if num_match:
            return QuestionMatchResult(matched_question=num_match, match_type="explicit_number", confidence=1.0)

        # 2. Explicit question text
        text_match = self.match_by_explicit_text(student_text, questions)
        if text_match:
            return QuestionMatchResult(matched_question=text_match, match_type="explicit_text", confidence=0.95)

        # 3. Semantic matching
        return await self.match_semantically(student_text, questions)
