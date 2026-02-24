from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from datetime import datetime, timedelta
from bson import ObjectId
from config import get_settings
from database import get_db

settings = get_settings()
bearer_scheme = HTTPBearer()


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado"
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    payload = decode_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido")

    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    if user.get("status") == "suspended":
        raise HTTPException(status_code=403, detail="Cuenta suspendida")

    user["id"] = str(user["_id"])
    return user


async def require_provider(current_user=Depends(get_current_user)):
    if current_user["account_type"] not in ("provider_business", "superadmin"):
        raise HTTPException(status_code=403, detail="Se requiere cuenta de negocio")
    return current_user


async def require_admin(current_user=Depends(get_current_user)):
    if current_user["account_type"] != "superadmin":
        raise HTTPException(status_code=403, detail="Se requiere cuenta de administrador")
    return current_user
