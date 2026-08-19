import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch, MagicMock
from app.main import app
from app.models import PageExtraction

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_extract_missing_files():
    response = client.post(
        "/extract",
        data={"questions": '["Q1. What is photosynthesis?"]'}
    )
    assert response.status_code == 422  # FastAPI validation error for missing form field


def test_extract_invalid_file_extension():
    files = [
        ("files", ("exam.txt", b"plain text content", "text/plain"))
    ]
    response = client.post(
        "/extract",
        files=files,
        data={"questions": '["Q1. Test question"]'}
    )
    assert response.status_code == 400
    assert "Only PDF files are supported" in response.json()["detail"]


def test_extract_duplicate_filenames():
    files = [
        ("files", ("student1.pdf", b"%PDF-1.4...", "application/pdf")),
        ("files", ("student1.pdf", b"%PDF-1.4...", "application/pdf"))
    ]
    response = client.post(
        "/extract",
        files=files,
        data={"questions": '["Q1. Test question"]'}
    )
    assert response.status_code == 400
    assert "Duplicate filename" in response.json()["detail"]


def test_extract_empty_questions():
    files = [
        ("files", ("student1.pdf", b"%PDF-1.4 dummy", "application/pdf"))
    ]
    response = client.post(
        "/extract",
        files=files,
        data={"questions": "[]"}
    )
    assert response.status_code == 422
    assert "cannot be empty" in response.json()["detail"]
