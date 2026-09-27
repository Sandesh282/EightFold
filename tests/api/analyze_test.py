"""
Backend API tests for POST /analyze

Run with:
    cd backend
    pip install pytest httpx fastapi
    pytest ../tests/api/analyze_test.py -v
"""
import json
import sys
import os
import pytest
from unittest.mock import patch, MagicMock
from io import BytesIO

# Make sure the backend module is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))

# Fixture JSON that call_gemini should return
FIXTURE_RESULT = {
    "score": 82,
    "label": "Good Match",
    "skills": {
        "verified": ["Python", "FastAPI", "React"],
        "learnable": ["Docker", "PostgreSQL"],
        "missing": ["Kubernetes"],
    },
    "resume_skills": ["Python", "FastAPI", "React", "Docker"],
    "resume_verified": ["Python", "FastAPI", "React"],
    "resume_unverified": ["Docker"],
    "skill_scores": {"Python": 90, "FastAPI": 85, "React": 80, "Docker": 30},
    "experience_years": 2,
    "education": "B.Tech Computer Science",
    "learningPrediction": "Estimated time to become fully job-ready: 2–3 weeks",
    "aiInsight": "Strong Python and FastAPI match. Minor gaps in containerisation.",
    "candidate_strengths": ["Python", "API design", "problem solving"],
    "candidate_gaps": ["Docker", "cloud infra"],
    "hirer_recommendation": "Hire — solid backend skills, ramp-up needed for DevOps",
    "interview_questions": [
        "Walk me through your FastAPI project architecture.",
        "How would you containerise this service with Docker?",
    ],
    "match_breakdown": {
        "technical_fit": 85,
        "experience_fit": 75,
        "problem_solving": 80,
        "learning_potential": 88,
    },
}

SAMPLE_JD = "We need a Python backend engineer with FastAPI experience."


@pytest.fixture
def client():
    """Return a TestClient for the FastAPI app with call_gemini mocked."""
    from httpx import AsyncClient
    from httpx._transports.asgi import ASGITransport

    with patch("main.call_gemini", return_value=FIXTURE_RESULT):
        # Import app after patching so the mock takes effect
        import main as backend_main
        app = backend_main.app

    import asyncio

    class SyncClient:
        """Thin sync wrapper over httpx AsyncClient for simpler test code."""
        def __init__(self, asgi_app):
            self._app = asgi_app

        def post(self, url, data=None, files=None):
            async def _run():
                async with AsyncClient(
                    transport=ASGITransport(app=self._app), base_url="http://test"
                ) as ac:
                    return await ac.post(url, data=data, files=files)
            return asyncio.get_event_loop().run_until_complete(_run())

    return SyncClient(app)


def test_analyze_returns_200_with_text_fixture():
    """POST /analyze with a plain-text 'resume' and mocked Gemini returns 200."""
    from httpx import AsyncClient
    from httpx._transports.asgi import ASGITransport
    import asyncio

    async def _run():
        with patch("main.call_gemini", return_value=FIXTURE_RESULT):
            import importlib
            import main as backend_main
            importlib.reload(backend_main)  # pick up the mock
            app = backend_main.app

            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as ac:
                response = await ac.post(
                    "/analyze",
                    data={
                        "job_description": SAMPLE_JD,
                        "github_data": "{}",
                        "cf_data": "{}",
                    },
                    files={
                        "resume": ("resume.txt", BytesIO(b"Experienced Python developer with FastAPI skills."), "text/plain")
                    },
                )
            return response

    response = asyncio.get_event_loop().run_until_complete(_run())
    assert response.status_code == 200


def test_analyze_response_contains_required_fields():
    """Response JSON must have score, label, and skills keys."""
    from httpx import AsyncClient
    from httpx._transports.asgi import ASGITransport
    import asyncio

    async def _run():
        with patch("main.call_gemini", return_value=FIXTURE_RESULT):
            import importlib
            import main as backend_main
            importlib.reload(backend_main)
            app = backend_main.app

            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as ac:
                response = await ac.post(
                    "/analyze",
                    data={
                        "job_description": SAMPLE_JD,
                        "github_data": "{}",
                        "cf_data": "{}",
                    },
                )
            return response

    response = asyncio.get_event_loop().run_until_complete(_run())
    assert response.status_code == 200
    body = response.json()
    assert "score" in body
    assert "label" in body
    assert "skills" in body
    assert isinstance(body["score"], int)
    assert body["score"] == 82


def test_analyze_no_resume_still_works():
    """POST /analyze without a resume file should still succeed."""
    from httpx import AsyncClient
    from httpx._transports.asgi import ASGITransport
    import asyncio

    async def _run():
        with patch("main.call_gemini", return_value=FIXTURE_RESULT):
            import importlib
            import main as backend_main
            importlib.reload(backend_main)
            app = backend_main.app

            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as ac:
                response = await ac.post(
                    "/analyze",
                    data={"job_description": SAMPLE_JD},
                )
            return response

    response = asyncio.get_event_loop().run_until_complete(_run())
    assert response.status_code == 200
    body = response.json()
    assert "score" in body
