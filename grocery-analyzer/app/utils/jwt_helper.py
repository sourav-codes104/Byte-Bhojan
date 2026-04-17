from app.utils.auth_utils import create_token, verify_token


def decode_token(token):
    """Decode JWT token and return email, or None if invalid."""
    decoded = verify_token(f"Bearer {token}") if token else None
    return decoded.get("email") if decoded else None
