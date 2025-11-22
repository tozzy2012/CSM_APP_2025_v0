from sqlalchemy import create_engine, inspect
from config import settings

def inspect_db():
    engine = create_engine(settings.DATABASE_URL)
    inspector = inspect(engine)
    
    print("\n--- Accounts Table ---")
    for col in inspector.get_columns("accounts"):
        print(f"{col['name']}: {col['type']}")
    print("PK:", inspector.get_pk_constraint("accounts"))

if __name__ == "__main__":
    inspect_db()
