"""
Password Hashing and Verification Utilities
Using bcrypt for secure password storage
"""
import bcrypt
from typing import Optional


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password string
    """
    # Generate salt and hash password
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hash
    
    Args:
        plain_password: Plain text password to check
        hashed_password: Hashed password from database
        
    Returns:
        True if password matches, False otherwise
    """
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except Exception:
        return False


# Generate a hash for example password "adminadmin"
if __name__ == "__main__":
    admin_password = "adminadmin"
    hashed = hash_password(admin_password)
    print(f"Password: {admin_password}")
    print(f"Hash: {hashed}")
    print(f"Verification: {verify_password(admin_password, hashed)}")
