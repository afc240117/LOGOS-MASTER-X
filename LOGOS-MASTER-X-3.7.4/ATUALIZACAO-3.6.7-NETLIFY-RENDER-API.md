# LOGOS MASTER X 3.6.7 — NETLIFY ↔ RENDER API

- Corrige o Studio público que caía no pipeline local simplificado.
- Em localhost/127.0.0.1, usa a API local.
- No Netlify, usa automaticamente https://logos-master-x-api.onrender.com.
- Migra configurações antigas que salvaram o próprio domínio Netlify como URL da API.
- O 9Router só usa origem local quando o LOGOS estiver realmente em localhost.
- Mantém CORS já habilitado no backend FastAPI.
- Atualiza os assets para build 3.6.7.
