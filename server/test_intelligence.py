"""
Test script for Account Intelligence
Run this to test the intelligence endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_get_intelligence(account_id: str):
    """Test GET /accounts/{id}/intelligence"""
    print(f"\n{'='*60}")
    print(f"Testing Intelligence Endpoint for Account: {account_id}")
    print('='*60)
    
    url = f"{BASE_URL}/accounts/{account_id}/intelligence"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        
        data = response.json()
        
        print("\n✅ SUCCESS - Intelligence data received")
        print("\n📊 Account Info:")
        print(f"  Name: {data.get('account', {}).get('name')}")
        print(f"  Industry: {data.get('account', {}).get('industry')}")
        print(f"  Health Score: {data.get('health', {}).get('current_score')}/100")
        
        print("\n💰 Financial:")
        print(f"  MRR: R$ {data.get('financial', {}).get('current_mrr', 0):,.2f}")
        print(f"  Days to Renewal: {data.get('financial', {}).get('days_to_renewal')}")
        
        print("\n📋 Tasks:")
        print(f"  Open: {data.get('tasks', {}).get('open')}")
        print(f"  Overdue: {data.get('tasks', {}).get('overdue')}")
        
        print("\n🎯 Activities (30d):")
        print(f"  Total: {data.get('activities', {}).get('total_30d')}")
        print(f"  Last Interaction: {data.get('activities', {}).get('days_since_last_interaction')} days ago")
        
        print("\n⚠️  Risks Detected:")
        risks = data.get('risks', [])
        if risks:
            for risk in risks:
                print(f"  - [{risk['severity'].upper()}] {risk['description']}")
        else:
            print("  None")
        
        print("\n🚀 Opportunities Detected:")
        opps = data.get('opportunities', [])
        if opps:
            for opp in opps:
                print(f"  - [{opp['confidence'].upper()}] {opp['description']}")
        else:
            print("  None")
        
        return data
        
    except requests.exceptions.RequestException as e:
        print(f"\n❌ ERROR: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.text}")
        return None


def test_ai_analysis(account_id: str):
    """Test POST /accounts/{id}/analyze"""
    print(f"\n{'='*60}")
    print(f"Testing AI Analysis for Account: {account_id}")
    print('='*60)
    
    url = f"{BASE_URL}/accounts/{account_id}/analyze"
    
    try:
        print("\n🤖 Calling OpenAI API (this may take a few seconds)...")
        
        response = requests.post(url)
        response.raise_for_status()
        
        data = response.json()
        ai_analysis = data.get('ai_analysis', {})
        
        print("\n✅ SUCCESS - AI Analysis completed")
        
        print("\n📝 Summary:")
        print(f"  {ai_analysis.get('summary', 'N/A')}")
        
        print("\n🏥 Health Assessment:")
        health_assess = ai_analysis.get('health_assessment', {})
        print(f"  Overall: {health_assess.get('overall_health', 'N/A')}")
        print(f"  Strengths:")
        for strength in health_assess.get('key_strengths', []):
            print(f"    - {strength}")
        print(f"  Concerns:")
        for concern in health_assess.get('key_concerns', []):
            print(f"    - {concern}")
        
        print("\n⚠️  Churn Risk:")
        churn = ai_analysis.get('churn_risk', {})
        print(f"  Score: {churn.get('score', 'N/A')}/100")
        print(f"  Level: {churn.get('level', 'N/A').upper()}")
        
        print("\n🎯 Next Best Actions:")
        for action in ai_analysis.get('next_best_actions', [])[:3]:
            print(f"  - [{action.get('timeline', 'N/A').upper()}] {action.get('action')}")
            print(f"    Rationale: {action.get('rationale')}")
        
        print("\n💡 Strategic Insights:")
        for insight in ai_analysis.get('strategic_insights', []):
            print(f"  - {insight}")
        
        metadata = ai_analysis.get('_metadata', {})
        print(f"\n📊 Metadata:")
        print(f"  Model: {metadata.get('model')}")
        print(f"  Tokens: {metadata.get('tokens_used')}")
        
        return data
        
    except requests.exceptions.RequestException as e:
        print(f"\n❌ ERROR: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.text}")
            if e.response.status_code == 503:
                print("\n💡 TIP: Make sure you have set your OpenAI API key in Settings > AI")
        return None


if __name__ == "__main__":
    import sys
    
    # Get account ID from command line or use default
    account_id = sys.argv[1] if len(sys.argv) > 1 else "acc-default"
    
    print("🧪 Account Intelligence Test Suite")
    print(f"Target: {BASE_URL}")
    
    # Test 1: Get intelligence data
    context = test_get_intelligence(account_id)
    
    # Test 2: AI Analysis (only if user confirms)
    if context:
        print("\n" + "="*60)
        choice = input("\n🤖 Run AI Analysis? This will consume OpenAI tokens. (y/N): ")
        if choice.lower() == 'y':
            test_ai_analysis(account_id)
        else:
            print("\n⏭️  Skipping AI analysis")
    
    print("\n✅ Tests completed")
