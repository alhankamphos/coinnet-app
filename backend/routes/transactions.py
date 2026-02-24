from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from datetime import datetime
from bson import ObjectId
from database import get_db
from models.transaction import TransactionCreate, TransactionInDB, DisputeCreate, calculate_commission
from middleware.auth import get_current_user
from services.s3 import upload_proof
import random
import string

router = APIRouter(prefix="/transactions", tags=["Transacciones"])

VALID_STATUSES = ["requested", "accepted", "sinpe_sent", "proof_uploaded", "verified", "completed", "cancelled", "disputed"]


def generate_code():
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"CN-{datetime.utcnow().strftime('%Y%m')}-{suffix}"


def format_tx(tx: dict, include_sinpe: bool = False) -> dict:
    result = {
        "id": str(tx["_id"]),
        "transaction_code": tx["transaction_code"],
        "user_id": tx["user_id"],
        "provider_id": tx["provider_id"],
        "status": tx["status"],
        "requested_amount": tx["requested_amount"],
        "commission_amount": tx["commission_amount"],
        "total_to_send": tx["total_to_send"],
        "proof_url": tx.get("proof_s3_url"),
        "timeline": tx.get("timeline", []),
        "dispute": tx.get("dispute"),
        "created_at": tx["created_at"],
        "updated_at": tx["updated_at"],
    }
    if include_sinpe:
        result["sinpe_number"] = tx.get("sinpe_number")
        result["sinpe_holder_name"] = tx.get("sinpe_holder_name")
        result["provider_name"] = tx.get("provider_name")
    return result


def add_timeline_event(tx: dict, status: str, actor: str, notes: str = "") -> list:
    events = tx.get("timeline", [])
    events.append({"status": status, "timestamp": datetime.utcnow().isoformat(), "actor": actor, "notes": notes})
    return events


@router.post("/", summary="Crear transacción")
async def create_transaction(data: TransactionCreate, current_user=Depends(get_current_user)):
    db = get_db()

    # Validar proveedor
    try:
        provider = await db.providers.find_one({"_id": ObjectId(data.provider_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="ID de proveedor inválido")
    if not provider:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    if not provider.get("is_available"):
        raise HTTPException(status_code=400, detail="El negocio no está disponible en este momento")
    if data.requested_amount < provider.get("min_amount", 1000):
        raise HTTPException(status_code=400, detail=f"Monto mínimo: ₡{provider['min_amount']:,.0f}")
    if data.requested_amount > provider.get("max_amount", 100000):
        raise HTTPException(status_code=400, detail=f"Monto máximo: ₡{provider['max_amount']:,.0f}")

    # Verificar transacciones activas del usuario (máx 2)
    active_count = await db.transactions.count_documents({
        "user_id": current_user["id"],
        "status": {"$in": ["requested", "accepted", "sinpe_sent", "proof_uploaded"]}
    })
    if active_count >= 2:
        raise HTTPException(status_code=400, detail="Tienes demasiadas transacciones activas. Completa o cancela las anteriores.")

    commission_data = calculate_commission(data.requested_amount)

    doc = {
        "transaction_code": generate_code(),
        "user_id": current_user["id"],
        "provider_id": data.provider_id,
        "provider_name": provider["business_name"],
        "sinpe_number": provider["sinpe_number"],
        "sinpe_holder_name": provider["sinpe_holder_name"],
        "status": "requested",
        **commission_data,
        "proof_s3_url": None,
        "proof_uploaded_at": None,
        "sinpe_sent_at": None,
        "verified_at": None,
        "completed_at": None,
        "cancelled_at": None,
        "timeline": [{"status": "requested", "timestamp": datetime.utcnow().isoformat(), "actor": current_user["id"], "notes": "Transacción creada"}],
        "dispute": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    result = await db.transactions.insert_one(doc)
    doc["_id"] = result.inserted_id
    return format_tx(doc, include_sinpe=True)


@router.get("/my", summary="Mis transacciones")
async def get_my_transactions(current_user=Depends(get_current_user)):
    db = get_db()
    cursor = db.transactions.find({"user_id": current_user["id"]}).sort("created_at", -1).limit(50)
    txs = await cursor.to_list(length=50)
    return [format_tx(tx, include_sinpe=True) for tx in txs]


@router.get("/provider/pending", summary="Solicitudes pendientes del proveedor")
async def get_provider_pending(current_user=Depends(get_current_user)):
    db = get_db()
    provider = await db.providers.find_one({"user_id": current_user["id"]})
    if not provider:
        raise HTTPException(status_code=404, detail="No tienes perfil de proveedor")

    cursor = db.transactions.find({
        "provider_id": str(provider["_id"]),
        "status": {"$in": ["requested", "accepted", "sinpe_sent", "proof_uploaded"]}
    }).sort("created_at", -1)
    txs = await cursor.to_list(length=50)
    return [format_tx(tx, include_sinpe=True) for tx in txs]


@router.get("/{tx_id}", summary="Ver transacción")
async def get_transaction(tx_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    try:
        tx = await db.transactions.find_one({"_id": ObjectId(tx_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="ID inválido")
    if not tx:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")

    provider = await db.providers.find_one({"user_id": current_user["id"]})
    provider_id_str = str(provider["_id"]) if provider else None

    is_owner = tx["user_id"] == current_user["id"] or tx["provider_id"] == provider_id_str
    is_admin = current_user["account_type"] == "superadmin"
    if not is_owner and not is_admin:
        raise HTTPException(status_code=403, detail="Sin acceso a esta transacción")

    return format_tx(tx, include_sinpe=True)


@router.patch("/{tx_id}/accept", summary="Proveedor acepta solicitud")
async def accept_transaction(tx_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    provider = await db.providers.find_one({"user_id": current_user["id"]})
    if not provider:
        raise HTTPException(status_code=403, detail="No tienes perfil de proveedor")

    tx = await db.transactions.find_one({"_id": ObjectId(tx_id)})
    if not tx:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    if tx["provider_id"] != str(provider["_id"]):
        raise HTTPException(status_code=403, detail="Esta solicitud no es tuya")
    if tx["status"] != "requested":
        raise HTTPException(status_code=400, detail=f"No se puede aceptar — estado actual: {tx['status']}")

    timeline = add_timeline_event(tx, "accepted", current_user["id"], "Proveedor aceptó la solicitud")
    await db.transactions.update_one(
        {"_id": ObjectId(tx_id)},
        {"$set": {"status": "accepted", "timeline": timeline, "updated_at": datetime.utcnow()}}
    )
    return {"status": "accepted", "message": "Solicitud aceptada. El usuario enviará el SINPE."}


@router.patch("/{tx_id}/sinpe-sent", summary="Usuario marca SINPE enviado")
async def mark_sinpe_sent(tx_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    tx = await db.transactions.find_one({"_id": ObjectId(tx_id)})
    if not tx:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    if tx["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Sin permisos")
    if tx["status"] != "accepted":
        raise HTTPException(status_code=400, detail=f"Estado actual: {tx['status']}")

    timeline = add_timeline_event(tx, "sinpe_sent", current_user["id"], "Usuario marcó SINPE como enviado")
    await db.transactions.update_one(
        {"_id": ObjectId(tx_id)},
        {"$set": {"status": "sinpe_sent", "sinpe_sent_at": datetime.utcnow(), "timeline": timeline, "updated_at": datetime.utcnow()}}
    )
    return {"status": "sinpe_sent"}


@router.post("/{tx_id}/proof", summary="Subir comprobante")
async def upload_transaction_proof(
    tx_id: str,
    file: UploadFile = File(...),
    current_user=Depends(get_current_user)
):
    db = get_db()
    tx = await db.transactions.find_one({"_id": ObjectId(tx_id)})
    if not tx:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    if tx["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Sin permisos")
    if tx["status"] not in ("sinpe_sent", "accepted"):
        raise HTTPException(status_code=400, detail=f"Estado actual: {tx['status']}")

    proof_url = await upload_proof(file, tx_id)
    timeline = add_timeline_event(tx, "proof_uploaded", current_user["id"], "Comprobante subido")
    await db.transactions.update_one(
        {"_id": ObjectId(tx_id)},
        {"$set": {
            "status": "proof_uploaded",
            "proof_s3_url": proof_url,
            "proof_uploaded_at": datetime.utcnow(),
            "timeline": timeline,
            "updated_at": datetime.utcnow()
        }}
    )
    return {"status": "proof_uploaded", "proof_url": proof_url}


@router.patch("/{tx_id}/verify", summary="Proveedor verifica SINPE recibido")
async def verify_transaction(tx_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    provider = await db.providers.find_one({"user_id": current_user["id"]})
    if not provider:
        raise HTTPException(status_code=403, detail="No tienes perfil de proveedor")

    tx = await db.transactions.find_one({"_id": ObjectId(tx_id)})
    if not tx:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    if tx["provider_id"] != str(provider["_id"]):
        raise HTTPException(status_code=403, detail="Sin permisos")
    if tx["status"] != "proof_uploaded":
        raise HTTPException(status_code=400, detail=f"Estado actual: {tx['status']}")

    timeline = add_timeline_event(tx, "verified", current_user["id"], "SINPE verificado por proveedor")
    await db.transactions.update_one(
        {"_id": ObjectId(tx_id)},
        {"$set": {"status": "verified", "verified_at": datetime.utcnow(), "timeline": timeline, "updated_at": datetime.utcnow()}}
    )
    return {"status": "verified", "message": "SINPE verificado. Entrega el efectivo."}


@router.patch("/{tx_id}/complete", summary="Proveedor marca completado")
async def complete_transaction(tx_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    provider = await db.providers.find_one({"user_id": current_user["id"]})
    if not provider:
        raise HTTPException(status_code=403, detail="No tienes perfil de proveedor")

    tx = await db.transactions.find_one({"_id": ObjectId(tx_id)})
    if not tx:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    if tx["provider_id"] != str(provider["_id"]):
        raise HTTPException(status_code=403, detail="Sin permisos")
    if tx["status"] != "verified":
        raise HTTPException(status_code=400, detail=f"Estado actual: {tx['status']}")

    timeline = add_timeline_event(tx, "completed", current_user["id"], "Efectivo entregado")
    await db.transactions.update_one(
        {"_id": ObjectId(tx_id)},
        {"$set": {"status": "completed", "completed_at": datetime.utcnow(), "timeline": timeline, "updated_at": datetime.utcnow()}}
    )

    # Actualizar estadísticas del proveedor
    await db.providers.update_one(
        {"_id": provider["_id"]},
        {"$inc": {"total_transactions": 1, "total_volume": tx["requested_amount"]}}
    )
    await db.users.update_one({"_id": ObjectId(tx["user_id"])}, {"$inc": {"total_transactions": 1}})

    return {"status": "completed", "message": "¡Transacción completada!"}


@router.patch("/{tx_id}/cancel", summary="Cancelar transacción")
async def cancel_transaction(tx_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    tx = await db.transactions.find_one({"_id": ObjectId(tx_id)})
    if not tx:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")

    provider = await db.providers.find_one({"user_id": current_user["id"]})
    provider_id_str = str(provider["_id"]) if provider else None

    is_participant = tx["user_id"] == current_user["id"] or tx["provider_id"] == provider_id_str
    if not is_participant and current_user["account_type"] != "superadmin":
        raise HTTPException(status_code=403, detail="Sin permisos")
    if tx["status"] in ("completed", "cancelled"):
        raise HTTPException(status_code=400, detail="No se puede cancelar")

    timeline = add_timeline_event(tx, "cancelled", current_user["id"], "Cancelada por participante")
    await db.transactions.update_one(
        {"_id": ObjectId(tx_id)},
        {"$set": {"status": "cancelled", "cancelled_at": datetime.utcnow(), "timeline": timeline, "updated_at": datetime.utcnow()}}
    )
    return {"status": "cancelled"}


@router.post("/{tx_id}/dispute", summary="Abrir disputa")
async def open_dispute(tx_id: str, data: DisputeCreate, current_user=Depends(get_current_user)):
    db = get_db()
    tx = await db.transactions.find_one({"_id": ObjectId(tx_id)})
    if not tx:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")

    provider = await db.providers.find_one({"user_id": current_user["id"]})
    provider_id_str = str(provider["_id"]) if provider else None
    is_participant = tx["user_id"] == current_user["id"] or tx["provider_id"] == provider_id_str
    if not is_participant:
        raise HTTPException(status_code=403, detail="Sin permisos")
    if tx["status"] in ("completed", "cancelled", "disputed"):
        raise HTTPException(status_code=400, detail=f"Estado actual: {tx['status']}")

    dispute = {"reason": data.reason, "opened_by": current_user["id"], "opened_at": datetime.utcnow().isoformat(), "resolved_at": None, "resolution": None}
    timeline = add_timeline_event(tx, "disputed", current_user["id"], f"Disputa: {data.reason}")
    await db.transactions.update_one(
        {"_id": ObjectId(tx_id)},
        {"$set": {"status": "disputed", "dispute": dispute, "timeline": timeline, "updated_at": datetime.utcnow()}}
    )
    return {"status": "disputed", "message": "Disputa abierta. Un administrador la revisará."}
