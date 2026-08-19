import abc
import json
import base64
import logging
from typing import Optional
from google import genai
from google.genai import types
from app.config import settings
from app.models import PageExtraction
from app.prompts import TRANSCRIPTION_SYSTEM_PROMPT

logger = logging.getLogger("vision_service")


class VisionExtractor(abc.ABC):
    @abc.abstractmethod
    async def extract_page(self, page_num: int, image_bytes: bytes) -> PageExtraction:
        """Extract faithful transcription from a single page image."""
        pass


class GeminiVisionExtractor(VisionExtractor):
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.AI_API_KEY
        self.model = model or settings.AI_MODEL
        self.client = genai.Client(api_key=self.api_key)

    async def extract_page(self, page_num: int, image_bytes: bytes, max_retries: int = 2) -> PageExtraction:
        encoded_image = base64.b64encode(image_bytes).decode("utf-8")
        
        for attempt in range(max_retries + 1):
            try:
                response = self.client.models.generate_content(
                    model=self.model,
                    contents=[
                        types.Part.from_bytes(
                            data=image_bytes,
                            mime_type="image/png"
                        ),
                        "Extract the handwritten content from this examination script page faithfully. Strictly follow all strikethrough, caret, and fidelity preservation instructions."
                    ],
                    config=types.GenerateContentConfig(
                        system_instruction=TRANSCRIPTION_SYSTEM_PROMPT,
                        response_mime_type="application/json",
                        temperature=0.0
                    )
                )

                raw_text = response.text or "{}"
                # Clean up markdown fencing if returned
                if raw_text.startswith("```"):
                    raw_text = raw_text.strip("`").replace("json\n", "", 1).strip()

                parsed = json.loads(raw_text)
                return PageExtraction(
                    page=page_num,
                    text=parsed.get("text", "").strip(),
                    question_hints=parsed.get("question_hints", []),
                    confidence=parsed.get("confidence", 0.95)
                )
            except Exception as exc:
                logger.warning(f"Vision transcription attempt {attempt + 1} failed for page {page_num}: {exc}")
                if attempt == max_retries:
                    logger.error(f"Exhausted retries for page {page_num}. Raising exception.")
                    raise RuntimeError(f"Vision model extraction failed on page {page_num}: {str(exc)}") from exc
