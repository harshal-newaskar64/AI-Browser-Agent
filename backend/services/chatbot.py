# services/groq_client.py

from groq import Groq
import os

class GroqClient:
    def __init__(self):
        self.client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

    def chat(self, messages):
        response = self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.5
        )
        return response.choices[0].message.content