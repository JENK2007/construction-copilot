from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("OPENROUTER_API_KEY")
print(f"Key found: {key[:15]}..." if key else "NO KEY FOUND")

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=key,
)

response = client.chat.completions.create(
    model="openrouter/free",
    messages=[{"role": "user", "content": "Say hello in one sentence"}]
)
print(response.choices[0].message.content)