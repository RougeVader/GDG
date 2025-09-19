
import httpx
import json

OLLAMA_API_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llava:13b"

def stream_ollama_response(prompt, context):
    """
    Streams the response from the Ollama API.
    """
    with httpx.stream(
        "POST",
        OLLAMA_API_URL,
        json={"model": OLLAMA_MODEL, "prompt": prompt, "context": context, "stream": True},
        timeout=None,
    ) as response:
        if response.status_code != 200:
            print(f"Error: Ollama API returned status code {response.status_code}")
            print(response.read())
            return

        response_context = []
        for chunk in response.iter_bytes():
            if chunk:
                try:
                    lines = chunk.decode("utf-8").splitlines()
                    for line in lines:
                        if line:
                            json_chunk = json.loads(line)
                            if "response" in json_chunk:
                                print(json_chunk["response"], end="", flush=True)
                            if json_chunk.get("done"):
                                print() # for newline at the end
                                response_context = json_chunk.get("context", [])
                except json.JSONDecodeError:
                    continue
        return response_context

def main():
    """
    Main function for the console chatbot.
    """
    print("Console Chatbot. Type 'exit' to quit.")
    context = []
    while True:
        prompt = input("> ")
        if prompt.lower() == "exit":
            break
        
        print("AI: ", end="")
        context = stream_ollama_response(prompt, context)

if __name__ == "__main__":
    main()
