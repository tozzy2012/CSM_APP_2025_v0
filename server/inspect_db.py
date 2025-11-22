from sqlalchemy import create_engine, inspect
from config import settings

def inspect_db():
    engine = create_engine(settings.DATABASE_URL)
    inspector = inspect(engine)
    
    print("Tables:", inspector.get_table_names())
    
    print("\n--- Accounts Table ---")
    for col in inspector.get_columns("accounts"):
        print(col)
    print("PK:", inspector.get_pk_constraint("accounts"))
        
    print("\n--- Tasks Table ---")
    for col in inspector.get_columns("tasks"):
        print(col)
    print("FKs:", inspector.get_foreign_keys("tasks"))

if __name__ == "__main__":
    inspect_db()
