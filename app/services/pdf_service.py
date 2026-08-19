import io
import os
import tempfile
from typing import List, Tuple
from fastapi import HTTPException, status
import fitz  # PyMuPDF
from PIL import Image
from app.config import settings


class PDFService:
    def __init__(self, dpi: int = settings.PDF_DPI):
        self.dpi = dpi
        # 72 DPI is base point scale in PDF; zoom factor = dpi / 72
        self.zoom = dpi / 72.0

    def render_pdf_bytes_to_images(self, pdf_bytes: bytes, filename: str) -> List[Tuple[int, bytes]]:
        """
        Renders each page of the PDF to PNG bytes at the configured DPI.
        Returns a list of tuples: (page_number_1_indexed, png_bytes).
        """
        max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        if len(pdf_bytes) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File '{filename}' exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB} MB."
            )

        pages_data: List[Tuple[int, bytes]] = []

        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Could not parse PDF file '{filename}'. Ensure it is a valid PDF document."
            )

        if doc.page_count == 0:
            doc.close()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"PDF file '{filename}' contains 0 pages."
            )

        mat = fitz.Matrix(self.zoom, self.zoom)

        try:
            for page_idx in range(doc.page_count):
                page = doc.load_page(page_idx)
                pix = page.get_pixmap(matrix=mat, alpha=False)
                png_bytes = pix.tobytes(output="png")
                pages_data.append((page_idx + 1, png_bytes))
        finally:
            doc.close()

        return pages_data
