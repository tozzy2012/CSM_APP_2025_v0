#!/usr/bin/env python3
"""
Test if Perplexity key can be read from database
"""
import sys
import os

# Add server directory to path
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal
from models import Tenant
import json

def test_perplexity_key():
    """Test reading Perplexity key from database"""
    db = SessionLocal()
    
    try:
        print("=" * 80)
        print("TESTE DE LEITURA DA CHAVE PERPLEXITY")
        print("=" * 80)
        
        # Get tenant
        tenant = db.query(Tenant).first()
        
        if not tenant:
            print("❌ ERRO: Nenhum tenant encontrado!")
            return False
            
        print(f"✅ Tenant encontrado: {tenant.tenant_id}")
        
        if not tenant.settings:
            print("❌ ERRO: Tenant não tem settings!")
            return False
            
        print(f"✅ Tenant tem settings")
        
        # Get AI settings
        ai_settings = tenant.settings.get('ai', {})
        print(f"✅ AI settings encontrado com {len(ai_settings)} chaves")
        print(f"   Chaves disponíveis: {list(ai_settings.keys())}")
        
        # Check OpenAI key
        openai_key = ai_settings.get('openaiApiKey', '')
        print(f"\n📍 OpenAI Key:")
        print(f"   Presente: {bool(openai_key)}")
        if openai_key:
            print(f"   Comprimento: {len(openai_key)}")
            print(f"   Primeiros 25 chars: {openai_key[:25]}...")
        
        # Check Perplexity key
        perplexity_key = ai_settings.get('perplexityApiKey', '')
        print(f"\n📍 Perplexity Key:")
        print(f"   Presente: {bool(perplexity_key)}")
        
        if perplexity_key:
            print(f"   ✅ CHAVE ENCONTRADA!")
            print(f"   Comprimento: {len(perplexity_key)}")
            print(f"   Primeiros 25 chars: {perplexity_key[:25]}...")
            print(f"   Começa com 'pplx-': {str(perplexity_key).startswith('pplx-')}")
            
            # Test validation logic
            is_valid = len(str(perplexity_key).strip()) > 10
            print(f"   Passa na validação (len > 10): {is_valid}")
            
            if is_valid:
                print(f"\n🎯 CHAVE VÁLIDA E DEVE SER USADA!")
                return True
            else:
                print(f"\n⚠️  Chave muito curta, não passa na validação")
                return False
        else:
            print(f"   ❌ CHAVE NÃO ENCONTRADA!")
            print(f"\n❌ PROBLEMA: Chave não está sendo salva ou lida corretamente")
            return False
            
    except Exception as e:
        print(f"\n❌ ERRO: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()
        print("=" * 80)

if __name__ == "__main__":
    result = test_perplexity_key()
    sys.exit(0 if result else 1)
