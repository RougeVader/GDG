

import json
import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional

# Define the request model for the chat endpoint
class ChatRequest(BaseModel):
    model: str
    prompt: str
    context: Optional[List[dict]] = None

# Initialize the FastAPI app
app = FastAPI()

# Configure CORS to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Define the Ollama API URL
OLLAMA_API_URL = "http://localhost:11434/api/generate"

async def stream_ollama_response(chat_request: ChatRequest):
    """
    Asynchronously streams the response from the Ollama API.
    """
    async with httpx.AsyncClient(timeout=None) as client:
        payload = {
            "model": chat_request.model,
            "prompt": chat_request.prompt,
            "context": chat_request.context or [],
            "stream": True # Ensure streaming is enabled
        }
        try:
            async with client.stream("POST", OLLAMA_API_URL, json=payload) as response:
                response.raise_for_status()
                async for chunk in response.aiter_bytes():
                    # Ollama streams NDJSON, so we need to decode and parse each line
                    if chunk:
                        try:
                            # Decode bytes to string and split by newline
                            lines = chunk.decode('utf-8').splitlines()
                            for line in lines:
                                if line:
                                    # Each line is a JSON object
                                    json_chunk = json.loads(line)
                                    # Yield the JSON chunk as a string for SSE
                                    yield f"data: {json.dumps(json_chunk)}\n\n"
                        except json.JSONDecodeError:
                            # In case of an incomplete JSON object in a chunk, just continue
                            continue
        except httpx.HTTPStatusError as e:
            await e.response.aread() # Read the response body
            error_details = e.response.content.decode('utf-8')
            error_message = {"error": f"Ollama API error: {e.response.status_code}", "details": error_details}
            yield f"data: {json.dumps(error_message)}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n" # Send done signal
        except httpx.RequestError as e:
            error_message = {"error": "Could not connect to Ollama server.", "details": str(e)}
            yield f"data: {json.dumps(error_message)}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n" # Send done signal


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
    return {"message": "Ollama Backend is running."}


