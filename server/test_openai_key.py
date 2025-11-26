"""
Quick test script to validate OpenAI API key
"""
from openai import OpenAI
import sys

api_key = "YOUR_API_KEY_HERE"

print("🔑 Testing OpenAI API Key...")
print(f"Key prefix: {api_key[:20]}...")

try:
    client = OpenAI(api_key=api_key)
    
    # Make a simple test call
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "user", "content": "Say 'test successful' in Portuguese"}
        ],
        max_tokens=20
    )
    
    result = response.choices[0].message.content
    tokens_used = response.usage.total_tokens
    
    print("\n✅ API KEY IS VALID!")
    print(f"📊 Test Response: {result}")
    print(f"🎯 Tokens Used: {tokens_used}")
    print(f"💰 Model: gpt-3.5-turbo")
    print("\n🎉 You're all set to use AI analysis!")
    
except Exception as e:
    print(f"\n❌ API KEY IS INVALID")
    print(f"Error: {str(e)}")
    sys.exit(1)
