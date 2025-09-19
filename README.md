# GDG Chatbot Project

This project is a simple, yet powerful chatbot application that interacts with the Ollama API. It has been developed in phases, starting from a simple console application to a full-fledged web application with a minimalistic frontend.

## Phases of Development

The project was developed through the following phases:

1.  **Console Chatbot:** A simple Python script that allows you to chat with the Ollama AI directly in your terminal.
2.  **Web Server Backend:** The console chatbot was transformed into a web server using FastAPI. This exposes the chatbot functionality through a REST API, allowing it to be used by any frontend application.
3.  **Minimalistic Web Frontend:** A lightweight, single-file HTML frontend was created to provide a simple, console-like web interface for the chatbot.

## Project Structure

The project is organized into the following directories:

-   `console-chatbot/`: Contains the backend server (`server.py`) and the original console chatbot script (`chatbot.py`).
-   `minimal-frontend/`: Contains the minimalistic web frontend (`index.html`).
-   `frontend/`: Contains the original React-based frontend. (This is from a previous iteration and is not the currently recommended frontend).
-   `backend/`: Contains the original FastAPI backend. (This is from a previous iteration and has been superseded by `console-chatbot/server.py`).

## Getting Started

To run the chatbot application, you will need to run the backend server and the frontend.

### Prerequisites

-   Python 3.7+
-   Node.js and npm (only for the original React frontend)
-   An running instance of the Ollama server.

### 1. Run the Backend Server

The backend server is located in the `console-chatbot` directory.

```bash
cd console-chatbot
pip install -r requirements.txt
uvicorn server:app --reload
```

The server will be running at `http://localhost:8000`.

### 2. Run the Minimalistic Frontend

The recommended frontend is the minimalistic one located in the `minimal-frontend` directory.

```bash
cd minimal-frontend
python -m http.server 8001
```

Now, open your web browser and navigate to `http://localhost:8001`. You can start chatting with the AI.

---

This project was developed with the help of a conversational AI assistant.