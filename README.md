# MOYÉ — Plateforme intelligente du patrimoine culturel ivoirien

Architecture microservices locale (Docker Compose) :
- Frontend : Next.js + TailwindCSS
- Backend API : Node.js Express + JWT + Swagger + Socket.io
- Service IA : Python FastAPI
- Base de données : PostgreSQL
- Cache : Redis
- Reverse proxy : Nginx

## Démarrage

```bash
cp .env.example .env
docker-compose up --build
```

## Accès
- Frontend : http://localhost:3000 *(direct container exposé via nginx root sur :80)*
- API : http://localhost:4000 *(ou via Nginx `/api` sur http://localhost)*
- IA : http://localhost:8000 *(ou via Nginx `/ai` sur http://localhost)*
- Swagger API : http://localhost:4000/swagger

## Modules couverts (MVP)
1. **Portail d'accueil** : hero sunrise animé, recherche universelle, carte Leaflet Côte d'Ivoire.
2. **Découverte** : CRUD ethnies + seed Baoulé/Sanwi + upload image + reconnaissance simulée.
3. **Pont** : traduction simulée, synthèse vocale navigateur, chat Socket.io avec traduction inline simulée.
4. **Académie** : utilisateurs JWT, quiz, points, niveaux, badges.
5. **Podcast** : upload audio + URL de streaming simple.

## Notes techniques
- Variables d'environnement centralisées via `.env`.
- Volume persistant PostgreSQL : `postgres_data`.
- Réseau Docker interne : `moye_net`.
- Script SQL initial : `backend/sql/init.sql`.
