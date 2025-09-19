

import httpx
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional

class ChatRequest(BaseModel):
    prompt: str
    context: Optional[List[dict]] = None

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_API_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llava:13b"

async def stream_ollama_response(chat_request: ChatRequest):
    """
    Asynchronously streams the response from the Ollama API.
    """
    async with httpx.AsyncClient(timeout=None) as client:
        payload = {
            "model": OLLAMA_MODEL,
            "prompt": chat_request.prompt,
            "context": chat_request.context or [],
            "stream": True,
        }
        try:
            async with client.stream("POST", OLLAMA_API_URL, json=payload) as response:
                response.raise_for_status()
                async for chunk in response.aiter_bytes():
                    if chunk:
                        try:
                            lines = chunk.decode("utf-8").splitlines()
                            for line in lines:
                                if line:
                                    json_chunk = json.loads(line)
                                    yield f"data: {json.dumps(json_chunk)}\n\n"
                        except json.JSONDecodeError:
                            continue
        except httpx.HTTPStatusError as e:
            await e.response.aread()
            error_message = {
                "error": f"Ollama API error: {e.response.status_code}",
                "details": e.response.text,
            }
            yield f"data: {json.dumps(error_message)}\n\n"
        except httpx.RequestError as e:
            error_message = {
                "error": "Could not connect to Ollama server.",
                "details": str(e),
            }
            yield f"data: {json.dumps(error_message)}\n\n"
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            error_message = {
                "error": "An unexpected error occurred on the server.",
                "details": str(e),
            }
            yield f"data: {json.dumps(error_message)}\n\n"

@app.post("/api/chat")
async def chat(chat_request: ChatRequest):
    """
    API endpoint to handle chat requests and stream responses from Ollama.
    """
    return StreamingResponse(
        stream_ollama_response(chat_request),
        media_type="text/event-stream"
    )

@app.get("/")
def read_root():
    return {"message": "Chatbot server is running."}

