from fastapi import APIRouter, HTTPException, Depends
from passlib.context import CryptContext
from datetime import datetime
from bson import ObjectId
from database import get_db
from models.user import UserCreate, UserLogin, UserOut
from middleware.auth import create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Autenticación"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


@router.post("/register", summary="Registrar usuario")
async def register(data: UserCreate):
    db = get_db()

    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")

    user_doc = {
        "email": data.email,
        "full_name": data.full_name,
        "phone": data.phone,
        "account_type": data.account_type,
        "status": "active",
        "password_hash": hash_password(data.password),
        "reputation_score": 5.0,
        "total_transactions": 0,
        "disputed_transactions": 0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    token = create_access_token({"sub": user_id, "account_type": data.account_type})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": data.email,
            "full_name": data.full_name,
            "account_type": data.account_type,
        }
    }


@router.post("/login", summary="Iniciar sesión")
async def login(data: UserLogin):
    db = get_db()

    user = await db.users.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    if user.get("status") == "suspended":
        raise HTTPException(status_code=403, detail="Cuenta suspendida")

    user_id = str(user["_id"])
    token = create_access_token({"sub": user_id, "account_type": user["account_type"]})

    # Obtener perfil de proveedor si aplica
    provider_id = None
    if user["account_type"] == "provider_business":
        provider = await db.providers.find_one({"user_id": user_id})
        if provider:
            provider_id = str(provider["_id"])

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": user["email"],
            "full_name": user["full_name"],
            "account_type": user["account_type"],
            "status": user["status"],
            "provider_id": provider_id,
        }
    }


@router.get("/me", summary="Perfil propio")
async def get_me(current_user=Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "full_name": current_user["full_name"],
        "phone": current_user.get("phone"),
        "account_type": current_user["account_type"],
        "status": current_user["status"],
        "reputation_score": current_user.get("reputation_score", 5.0),
        "total_transactions": current_user.get("total_transactions", 0),
        "created_at": current_user["created_at"],
    }
