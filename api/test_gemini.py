import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GEMINI_API_KEY")
print(f"Key found: {key[:10]}..." if key else "NO KEY FOUND")

genai.configure(api_key=key)
model = genai.GenerativeModel("gemini-2.0-flash")
r = model.generate_content("say hello in one sentence")
print(r.text)