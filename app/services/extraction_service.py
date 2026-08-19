import re
import logging
from typing import List, Dict, Tuple, Optional
from app.models import PageExtraction, ResponseItem, FileResult, ExtractionResponse
from app.services.vision_service import VisionExtractor
from app.services.question_service import QuestionMatchingService

logger = logging.getLogger("extraction_service")


class ExtractionService:
    def __init__(self, vision_extractor: VisionExtractor, question_service: QuestionMatchingService):
        self.vision_extractor = vision_extractor
        self.question_service = question_service

    def split_page_into_question_blocks(self, page_text: str) -> List[Tuple[Optional[str], str]]:
        """
        Splits a page's text if it contains multiple question boundaries (e.g. 'Q1... Q2...').
        Returns a list of (detected_question_marker, text_content).
        """
        # Pattern for question headers on their own lines or start of paragraph
        pattern = r"(?:\n\n|\A)(?:Q(?:uestion)?\s*[0-9]+|[0-9]+[\.\)])"
        
        matches = list(re.finditer(pattern, page_text, re.IGNORECASE))
        if not matches:
            return [(None, page_text)]
        
        blocks: List[Tuple[Optional[str], str]] = []
        last_idx = 0
        
        # If there is content before the first matched header (continuation from prev page)
        if matches[0].start() > 0:
            pre_text = page_text[:matches[0].start()].strip()
            if pre_text:
                blocks.append((None, pre_text))
            last_idx = matches[0].start()
            
        for i, match in enumerate(matches):
            start = match.start()
            end = matches[i + 1].start() if i + 1 < len(matches) else len(page_text)
            block_text = page_text[start:end].strip()
            if block_text:
                blocks.append((match.group(0).strip(), block_text))
                
        return blocks

    async def process_script(self, filename: str, pages_data: List[Tuple[int, bytes]], questions: List[str]) -> FileResult:
        """
        Processes a single student's examination script across all ordered pages.
        """
        page_extractions: List[PageExtraction] = []
        for page_num, image_bytes in pages_data:
            extraction = await self.vision_extractor.extract_page(page_num, image_bytes)
            page_extractions.append(extraction)

        # Responses map keyed by question string
        responses_by_question: Dict[str, List[str]] = {q: [] for q in questions}
        current_matched_question: Optional[str] = None

        for page in page_extractions:
            blocks = self.split_page_into_question_blocks(page.text)
            for marker, block_text in blocks:
                # If block has a question marker or we don't have an active question, attempt match
                if marker is not None or current_matched_question is None:
                    match_result = await self.question_service.identify_question(
                        student_text=block_text,
                        questions=questions,
                        hints=page.question_hints
                    )
                    if match_result.matched_question:
                        current_matched_question = match_result.matched_question
                    elif current_matched_question is None and len(questions) == 1:
                        current_matched_question = questions[0]

                if current_matched_question:
                    # Clean out redundant leading marker from response if matched
                    clean_text = block_text
                    if marker:
                        # Strip marker from beginning if desired, but keep genuine student answer
                        pass
                    responses_by_question[current_matched_question].append(clean_text)
                else:
                    # If completely unmatched, try matching whole block semantically
                    match_result = await self.question_service.match_semantically(block_text, questions)
                    if match_result.matched_question:
                        current_matched_question = match_result.matched_question
                        responses_by_question[current_matched_question].append(block_text)

        # Assemble final ordered responses matching input questions exactly
        response_items: List[ResponseItem] = []
        for q in questions:
            text_fragments = responses_by_question.get(q, [])
            if text_fragments:
                # Combine multi-page responses with genuine paragraph separation
                combined_response = "\n\n".join([frag.strip() for frag in text_fragments if frag.strip()])
                response_items.append(ResponseItem(question=q, response=combined_response if combined_response else None))
            else:
                response_items.append(ResponseItem(question=q, response=None))

        return FileResult(filename=filename, responses=response_items)
