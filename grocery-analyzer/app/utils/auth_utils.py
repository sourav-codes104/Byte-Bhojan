import jwt
import datetime

# 🔐 Secret key (same everywhere)
SECRET_KEY = "mysecretkey"


# ================= CREATE TOKEN =================
def create_token(email):
    token = jwt.encode({
        "email": email,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }, SECRET_KEY, algorithm="HS256")

    # fix PyJWT bytes issue
    if isinstance(token, bytes):
        token = token.decode("utf-8")

    return token


# ================= VERIFY TOKEN =================
def verify_token(auth_header):
    if not auth_header:
        return None

    try:
        parts = auth_header.split(" ")

        if len(parts) != 2:
            return None

        token = parts[1]

        decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return decoded

    except jwt.ExpiredSignatureError:
        return None

    except jwt.InvalidTokenError:
        return None