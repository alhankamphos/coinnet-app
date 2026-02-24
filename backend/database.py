from motor.motor_asyncio import AsyncIOMotorClient
from config import get_settings

settings = get_settings()

client: AsyncIOMotorClient = None


async def connect_db():
    global client
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client.coinnet
    # Índices geoespaciales
    await db.providers.create_index([("location", "2dsphere")])
    await db.users.create_index("email", unique=True)
    await db.users.create_index("phone", unique=True, sparse=True)
    await db.transactions.create_index([("user_id", 1), ("status", 1)])
    await db.transactions.create_index([("provider_id", 1), ("status", 1)])
    print("✅ Conectado a MongoDB")


async def close_db():
    global client
    if client:
        client.close()


def get_db():
    return client.coinnet
