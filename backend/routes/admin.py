from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime
from bson import ObjectId
from database import get_db
from middleware.auth import require_admin

router = APIRouter(prefix="/admin", tags=["Administración"])


@router.get("/metrics", summary="Métricas globales")
async def get_metrics(admin=Depends(require_admin)):
    db = get_db()

    total_users = await db.users.count_documents({"account_type": "user"})
    total_providers = await db.providers.count_documents({})
    active_providers = await db.providers.count_documents({"is_available": True})
    verified_providers = await db.providers.count_documents({"verification_status": "active"})
    total_transactions = await db.transactions.count_documents({})
    completed_transactions = await db.transactions.count_documents({"status": "completed"})
    disputed_transactions = await db.transactions.count_documents({"status": "disputed"})
    pending_review = await db.providers.count_documents({"verification_status": "pending_review"})

    # Volumen total
    pipeline = [
        {"$match": {"status": "completed"}},
        {"$group": {"_id": None, "total_volume": {"$sum": "$requested_amount"}, "total_commission": {"$sum": "$commission_amount"}}}
    ]
    vol_result = await db.transactions.aggregate(pipeline).to_list(1)
    volume_data = vol_result[0] if vol_result else {"total_volume": 0, "total_commission": 0}

    dispute_rate = (disputed_transactions / total_transactions * 100) if total_transactions > 0 else 0

    return {
        "users": {"total": total_users},
        "providers": {
            "total": total_providers,
            "active": active_providers,
            "verified": verified_providers,
            "pending_review": pending_review,
        },
        "transactions": {
            "total": total_transactions,
            "completed": completed_transactions,
            "disputed": disputed_transactions,
            "dispute_rate_pct": round(dispute_rate, 2),
        },
        "volume": {
            "total_colones": volume_data.get("total_volume", 0),
            "total_commission": volume_data.get("total_commission", 0),
        }
    }


@router.get("/providers", summary="Listar proveedores")
async def list_providers(
    status: str = Query(default=None),
    limit: int = Query(default=50),
    skip: int = Query(default=0),
    admin=Depends(require_admin)
):
    db = get_db()
    query = {}
    if status:
        query["verification_status"] = status

    cursor = db.providers.find(query).skip(skip).limit(limit).sort("created_at", -1)
    providers = await cursor.to_list(length=limit)

    return [{
        "id": str(p["_id"]),
        "user_id": p["user_id"],
        "business_name": p["business_name"],
        "sinpe_number": p["sinpe_number"],
        "sinpe_holder_name": p["sinpe_holder_name"],
        "bank_email": p.get("bank_email"),
        "verification_status": p["verification_status"],
        "is_available": p.get("is_available", False),
        "reputation_score": p.get("reputation_score", 5.0),
        "total_transactions": p.get("total_transactions", 0),
        "created_at": p["created_at"],
    } for p in providers]


@router.patch("/providers/{provider_id}/verify", summary="Verificar proveedor")
async def verify_provider(provider_id: str, admin=Depends(require_admin)):
    db = get_db()
    result = await db.providers.update_one(
        {"_id": ObjectId(provider_id)},
        {"$set": {"verification_status": "active", "updated_at": datetime.utcnow()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    return {"verification_status": "active", "message": "Proveedor verificado"}


@router.patch("/providers/{provider_id}/suspend", summary="Suspender proveedor")
async def suspend_provider(provider_id: str, admin=Depends(require_admin)):
    db = get_db()
    result = await db.providers.update_one(
        {"_id": ObjectId(provider_id)},
        {"$set": {"verification_status": "suspended", "is_available": False, "updated_at": datetime.utcnow()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    return {"verification_status": "suspended"}


@router.get("/users", summary="Listar usuarios")
async def list_users(
    status: str = Query(default=None),
    limit: int = Query(default=50),
    skip: int = Query(default=0),
    admin=Depends(require_admin)
):
    db = get_db()
    query = {}
    if status:
        query["status"] = status

    cursor = db.users.find(query, {"password_hash": 0}).skip(skip).limit(limit).sort("created_at", -1)
    users = await cursor.to_list(length=limit)
    return [{
        "id": str(u["_id"]),
        "email": u["email"],
        "full_name": u["full_name"],
        "account_type": u["account_type"],
        "status": u["status"],
        "reputation_score": u.get("reputation_score", 5.0),
        "total_transactions": u.get("total_transactions", 0),
        "created_at": u["created_at"],
    } for u in users]


@router.patch("/users/{user_id}/suspend", summary="Suspender usuario")
async def suspend_user(user_id: str, admin=Depends(require_admin)):
    db = get_db()
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"status": "suspended", "updated_at": datetime.utcnow()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"status": "suspended"}


@router.get("/disputes", summary="Ver disputas abiertas")
async def list_disputes(admin=Depends(require_admin)):
    db = get_db()
    cursor = db.transactions.find({"status": "disputed"}).sort("updated_at", -1)
    txs = await cursor.to_list(length=100)
    return [{
        "id": str(tx["_id"]),
        "transaction_code": tx["transaction_code"],
        "user_id": tx["user_id"],
        "provider_id": tx["provider_id"],
        "requested_amount": tx["requested_amount"],
        "dispute": tx.get("dispute"),
        "created_at": tx["created_at"],
    } for tx in txs]


@router.patch("/disputes/{tx_id}/resolve", summary="Resolver disputa")
async def resolve_dispute(tx_id: str, resolution: dict, admin=Depends(require_admin)):
    db = get_db()
    tx = await db.transactions.find_one({"_id": ObjectId(tx_id)})
    if not tx:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")

    dispute = tx.get("dispute", {})
    dispute["resolved_at"] = datetime.utcnow().isoformat()
    dispute["resolution"] = resolution.get("resolution", "Resuelto por administrador")
    dispute["admin_notes"] = resolution.get("notes", "")

    final_status = resolution.get("final_status", "cancelled")
    await db.transactions.update_one(
        {"_id": ObjectId(tx_id)},
        {"$set": {"status": final_status, "dispute": dispute, "updated_at": datetime.utcnow()}}
    )
    return {"status": final_status, "dispute": dispute}
