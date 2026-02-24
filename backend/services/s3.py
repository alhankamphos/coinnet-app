import boto3
from botocore.exceptions import ClientError
from fastapi import UploadFile, HTTPException
from config import get_settings
import uuid
import os

settings = get_settings()


def get_s3_client():
    if not settings.aws_access_key_id:
        return None
    return boto3.client(
        "s3",
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        region_name=settings.s3_region,
    )


async def upload_proof(file: UploadFile, transaction_id: str) -> str:
    s3 = get_s3_client()

    # Si no hay S3 configurado, retornar URL simulada para desarrollo
    if not s3:
        return f"https://placeholder.coinnet.app/proofs/{transaction_id}/{file.filename}"

    allowed_types = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Tipo de archivo no permitido. Use JPG, PNG o PDF.")

    file_ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    key = f"proofs/{transaction_id}/{uuid.uuid4()}{file_ext}"

    try:
        contents = await file.read()
        s3.put_object(
            Bucket=settings.s3_bucket_name,
            Key=key,
            Body=contents,
            ContentType=file.content_type,
        )
        return f"https://{settings.s3_bucket_name}.s3.{settings.s3_region}.amazonaws.com/{key}"
    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"Error al subir archivo: {str(e)}")
