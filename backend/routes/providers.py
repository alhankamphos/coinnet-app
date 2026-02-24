from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime
from bson import ObjectId
from database import get_db
from models.provider import ProviderCreate, ProviderUpdate, ProviderAvailability, ProviderInDB, LocationModel
from middleware.auth import get_current_user, require_provider
import math

router = APIRouter(prefix="/providers", tags=["Proveedores"])


def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def format_provider(p: dict, lat: float = None, lng: float = None) -> dict:
    coords = p.get("location", {}).get("coordinates", [0, 0])
    distance = None
    if lat and lng:
        distance = round(haversine(lat, lng, coords[1], coords[0]), 2)
    return {
        "id": str(p["_id"]),
        "user_id": p["user_id"],
        "business_name": p["business_name"],
        "sinpe_number": p["sinpe_number"],
        "sinpe_holder_name": p["sinpe_holder_name"],
        "address": p.get("address"),
        "latitude": coords[1],
        "longitude": coords[0],
        "description": p.get("description"),
        "verification_status": p.get("verification_status", "pending_review"),
        "is_available": p.get("is_available", False),
        "declared_liquidity": p.get("declared_liquidity"),
        "min_amount": p.get("min_amount", 1000),
        "max_amount": p.get("max_amount", 100000),
        "reputation_score": p.get("reputation_score", 5.0),
        "total_transactions": p.get("total_transactions", 0),
        "cover_photo": p.get("cover_photo"),
        "logo": p.get("logo"),
        "distance_km": distance,
        "created_at": p["created_at"],
    }


@router.post("/", summary="Crear perfil de proveedor")
async def create_provider(data: ProviderCreate, current_user=Depends(get_current_user)):
    db = get_db()

    if current_user["account_type"] not in ("provider_business", "superadmin"):
        raise HTTPException(status_code=403, detail="Solo cuentas de negocio pueden crear perfil de proveedor")

    existing = await db.providers.find_one({"user_id": current_user["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Ya tienes un perfil de proveedor")

    sinpe_taken = await db.providers.find_one({"sinpe_number": data.sinpe_number})
    if sinpe_taken:
        raise HTTPException(status_code=400, detail="Este número SINPE ya está registrado")

    doc = {
        "user_id": current_user["id"],
        "business_name": data.business_name,
        "sinpe_number": data.sinpe_number,
        "sinpe_holder_name": data.sinpe_holder_name,
        "bank_email": data.bank_email,
        "address": data.address,
        "location": {
            "type": "Point",
            "coordinates": [data.longitude, data.latitude]
        },
        "description": data.description,
        "verification_status": "pending_review",
        "is_available": False,
        "declared_liquidity": None,
        "min_amount": data.min_amount,
        "max_amount": data.max_amount,
        "reputation_score": 5.0,
        "total_transactions": 0,
        "total_volume": 0.0,
        "dispute_rate": 0.0,
        "cover_photo": None,
        "logo": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    result = await db.providers.insert_one(doc)
    doc["_id"] = result.inserted_id
    return format_provider(doc)


@router.get("/nearby", summary="Buscar proveedores cercanos")
async def get_nearby_providers(
    lat: float = Query(...),
    lng: float = Query(...),
    amount: float = Query(default=0),
    radius_km: float = Query(default=5),
    current_user=Depends(get_current_user)
):
    db = get_db()

    query = {
        "location": {
            "$near": {
                "$geometry": {"type": "Point", "coordinates": [lng, lat]},
                "$maxDistance": radius_km * 1000
            }
        },
        "is_available": True,
        "verification_status": {"$in": ["active", "pending_review"]},
    }

    if amount > 0:
        query["min_amount"] = {"$lte": amount}
        query["max_amount"] = {"$gte": amount}

    cursor = db.providers.find(query).limit(20)
    providers = await cursor.to_list(length=20)

    result = [format_provider(p, lat, lng) for p in providers]
    result.sort(key=lambda x: (
        0 if x["verification_status"] == "active" else 1,
        x["distance_km"] or 999
    ))

    return {"providers": result, "total": len(result)}


@router.get("/my", summary="Mi perfil de proveedor")
async def get_my_provider(current_user=Depends(get_current_user)):
    db = get_db()
    provider = await db.providers.find_one({"user_id": current_user["id"]})
    if not provider:
        raise HTTPException(status_code=404, detail="No tienes perfil de proveedor")
    return format_provider(provider)


@router.get("/{provider_id}", summary="Ver perfil de proveedor")
async def get_provider(provider_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    try:
        provider = await db.providers.find_one({"_id": ObjectId(provider_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="ID inválido")
    if not provider:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    return format_provider(provider)


@router.patch("/{provider_id}", summary="Actualizar perfil de proveedor")
async def update_provider(provider_id: str, data: ProviderUpdate, current_user=Depends(get_current_user)):
    db = get_db()
    provider = await db.providers.find_one({"_id": ObjectId(provider_id)})
    if not provider:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    if provider["user_id"] != current_user["id"] and current_user["account_type"] != "superadmin":
        raise HTTPException(status_code=403, detail="Sin permisos")

    update = {k: v for k, v in data.model_dump().items() if v is not None}
    if "latitude" in update and "longitude" in update:
        update["location"] = {"type": "Point", "coordinates": [update.pop("longitude"), update.pop("latitude")]}
    elif "latitude" in update:
        update.pop("latitude")
    elif "longitude" in update:
        update.pop("longitude")

    update["updated_at"] = datetime.utcnow()
    await db.providers.update_one({"_id": ObjectId(provider_id)}, {"$set": update})
    updated = await db.providers.find_one({"_id": ObjectId(provider_id)})
    return format_provider(updated)


@router.post("/{provider_id}/availability", summary="Activar/desactivar disponibilidad")
async def set_availability(provider_id: str, data: ProviderAvailability, current_user=Depends(get_current_user)):
    db = get_db()
    provider = await db.providers.find_one({"_id": ObjectId(provider_id)})
    if not provider:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    if provider["user_id"] != current_user["id"] and current_user["account_type"] != "superadmin":
        raise HTTPException(status_code=403, detail="Sin permisos")

    await db.providers.update_one(
        {"_id": ObjectId(provider_id)},
        {"$set": {
            "is_available": data.is_available,
            "declared_liquidity": data.declared_liquidity,
            "updated_at": datetime.utcnow()
        }}
    )
    return {"is_available": data.is_available, "declared_liquidity": data.declared_liquidity}
