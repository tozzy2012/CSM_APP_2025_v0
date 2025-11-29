import sys
import os
import random
import uuid
from datetime import datetime, timedelta
from decimal import Decimal

# Add parent directory to path so we can import from server
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models import Client, Account

def generate_cnpj():
    def calculate_digit(digits):
        weight = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        if len(digits) == 12:
            weight = [6] + weight
        
        val = sum(w * d for w, d in zip(weight, digits))
        rem = val % 11
        return 0 if rem < 2 else 11 - rem

    # Generate first 12 digits
    digits = [random.randint(0, 9) for _ in range(8)] + [0, 0, 0, 1]
    
    # Calculate first check digit
    digits.append(calculate_digit(digits))
    
    # Calculate second check digit
    digits.append(calculate_digit(digits))
    
    cnpj = "".join(map(str, digits))
    return f"{cnpj[:2]}.{cnpj[2:5]}.{cnpj[5:8]}/{cnpj[8:12]}-{cnpj[12:]}"

def generate_contacts(company_name_base):
    first_names = ["Ana", "Bruno", "Carlos", "Daniela", "Eduardo", "Fernanda", "Gustavo", "Helena", "Igor", "Juliana", "Lucas", "Mariana", "Nicolas", "Olivia", "Paulo", "Renata", "Silvia", "Tiago", "Vitor", "Wanessa"]
    last_names = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida"]
    
    roles = [
        ("CEO", "Decisor"), 
        ("CTO", "Influenciador Técnico"), 
        ("CFO", "Decisor Financeiro"), 
        ("Gerente de TI", "Usuário Principal"), 
        ("Coordenador de Projetos", "Usuário"), 
        ("Analista Sênior", "Usuário"),
        ("Diretor de Operações", "Decisor")
    ]
    
    domain = company_name_base.lower().replace(" ", "") + ".com.br"
    
    contacts = []
    num_contacts = random.randint(3, 6)
    
    used_names = set()
    
    for _ in range(num_contacts):
        first = random.choice(first_names)
        last = random.choice(last_names)
        full_name = f"{first} {last}"
        
        if full_name in used_names:
            continue
        used_names.add(full_name)
        
        role, power_role = random.choice(roles)
        email = f"{first.lower()}.{last.lower()}@{domain}"
        
        contacts.append({
            "name": full_name,
            "email": email,
            "phone": f"(11) 9{random.randint(1000, 9999)}-{random.randint(1000, 9999)}",
            "role": role,
            "power_role": power_role, # Helper for power map
            "department": "Gestão" # Default department
        })
        
    return contacts

def seed_clients():
    db = SessionLocal()
    
    # Clean up previous seeds
    print("Removendo dados de teste anteriores...")
    try:
        db.query(Account).filter(Account.csm == "Ricardo Lange", Account.type == "Cliente").delete(synchronize_session=False)
        db.query(Client).filter(Client.created_by == "system_seed").delete(synchronize_session=False)
        db.commit()
    except Exception as e:
        print(f"Erro ao limpar dados antigos: {e}")
        db.rollback()

    print("Iniciando geração de 50 clientes teste corrigidos...")
    
    industries = [
        "Tecnologia", "Varejo", "Finanças", "Saúde", "Logística", 
        "Educação", "Manufatura", "Serviços", "Agronegócio", "Construção"
    ]
    
    company_names_bases = [
        "TechSolutions", "InovaSoft", "GlobalLog", "AgroVerde", "EducaMais",
        "SaudeTotal", "FinancaFacil", "ConstruMax", "VarejoExpress", "AutoMec",
        "BioVida", "CyberSeg", "DataSystem", "EcoEnergy", "FastFood",
        "GoldInvest", "HomeCare", "InfoNet", "JetLog", "KingBurger",
        "LuzEletrica", "MasterChef", "NetConnect", "OpenSource", "PowerGym",
        "QualityAir", "RedeFarma", "StarTech", "TopFashion", "UrbanMob",
        "VisionOtica", "WebDesign", "XtremeSports", "YellowCab", "ZoomVideo",
        "AlphaImoveis", "BetaConsultoria", "GammaEngenharia", "DeltaTransportes", "EpsilonMarketing",
        "ZetaQuimica", "EtaAlimentos", "ThetaTurismo", "IotaSeguros", "KappaEventos",
        "LambdaAdvocacia", "MuContabilidade", "NuArquitetura", "XiPublicidade", "OmicronHotel"
    ]
    
    suffixes = ["Ltda", "S.A.", "Eireli", "Tecnologia", "Serviços", "Brasil", "Group", "Systems"]
    
    created_count = 0
    
    for base_name in company_names_bases:
        # Generate Company Data
        suffix = random.choice(suffixes)
        fantasy_name = f"{base_name}"
        legal_name = f"{base_name} {suffix}"
        industry = random.choice(industries)
        company_size = random.choice(["Pequena", "Média", "Grande"])
        
        # Determine MRR based on size
        if company_size == "Pequena":
            mrr = random.randint(1000, 5000)
        elif company_size == "Média":
            mrr = random.randint(5000, 20000)
        else: # Grande
            mrr = random.randint(20000, 80000)
            
        client_id = str(uuid.uuid4())
        
        # Generate Contacts and Power Map
        raw_contacts = generate_contacts(base_name)
        
        # Format for Client.contacts (ClientContact schema)
        # Schema: id, type, value, label, isPrimary
        client_contacts = []
        for i, c in enumerate(raw_contacts):
            # Email contact
            client_contacts.append({
                "id": str(uuid.uuid4()),
                "type": "email",
                "value": c["email"],
                "label": f"Email {c['name']}",
                "isPrimary": i == 0
            })
            # Phone contact
            client_contacts.append({
                "id": str(uuid.uuid4()),
                "type": "phone",
                "value": c["phone"],
                "label": f"Tel {c['name']}",
                "isPrimary": False
            })
        
        # Format for Client.power_map (PowerMapContact schema)
        # Schema: id, name, role, department, influence, email, phone, notes
        power_map = []
        for c in raw_contacts:
            if c["power_role"] in ["Decisor", "Influenciador Técnico", "Decisor Financeiro"]:
                influence = "champion" if c["power_role"] == "Decisor" else "influencer"
                power_map.append({
                    "id": str(uuid.uuid4()),
                    "name": c["name"],
                    "role": c["role"],
                    "department": c["department"],
                    "influence": influence,
                    "email": c["email"],
                    "phone": c["phone"],
                    "notes": f"Stakeholder identificado como {c['power_role']}"
                })
        
        client = Client(
            id=client_id,
            name=fantasy_name,
            legal_name=legal_name,
            cnpj=generate_cnpj(),
            industry=industry,
            website=f"www.{base_name.lower()}.com.br",
            company_size=company_size,
            notes=f"Cliente teste gerado automaticamente. Setor: {industry}.",
            contacts=client_contacts,
            power_map=power_map,
            created_by="system_seed"
        )
        
        db.add(client)
        
        # Generate Account Data
        account_id = str(uuid.uuid4())
        health_score = random.randint(30, 100)
        
        status = "Saudável"
        if health_score < 50:
            status = "Em Risco"
        elif health_score < 70:
            status = "Atenção"
            
        contract_start = datetime.now() - timedelta(days=random.randint(30, 730))
        contract_end = contract_start + timedelta(days=365)
        
        account = Account(
            id=account_id,
            client_id=client_id,
            name=fantasy_name,
            industry=industry,
            type="Cliente",
            status=status,
            health_status=status,
            health_score=health_score,
            mrr=mrr,
            contract_start=contract_start.date(),
            contract_end=contract_end.date(),
            csm="Ricardo Lange", # Default CSM
            website=f"www.{base_name.lower()}.com.br"
        )
        
        db.add(account)
        created_count += 1
        
    try:
        db.commit()
        print(f"Sucesso! {created_count} clientes e accounts criados com dados corrigidos.")
    except Exception as e:
        print(f"Erro ao salvar no banco: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_clients()
