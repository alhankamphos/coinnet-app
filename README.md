# 🔵 COINNET

Red estructurada de negocios físicos con liquidez.

## Estructura

```
coinnet/
├── frontend/    # React + Vite + PWA + TailwindCSS
├── backend/     # FastAPI + MongoDB + JWT
└── README.md
```

## Setup Rápido

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Llenar variables
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env      # Llenar variables
npm run dev
```

## Variables de Entorno

### Backend `.env`
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET_KEY=tu_clave_secreta_muy_larga
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=coinnet-proofs
S3_REGION=us-east-1
FRONTEND_URL=https://coinnet.vercel.app
```

### Frontend `.env`
```
VITE_API_URL=https://tu-backend.railway.app
```

## Deploy

### Frontend → Vercel
1. Push a GitHub
2. Importar repo en vercel.com
3. Root directory: `frontend`
4. Agregar variables de entorno en Vercel dashboard

### Backend → Railway
1. New project → Deploy from GitHub
2. Root directory: `backend`
3. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Agregar variables de entorno
