# API Contract

Endpoint principal:

POST `/api/generate`

Payload:
```json
{
  "mode": "sermon",
  "text": "Lamentações 5:21",
  "theme": "Restauração"
}
```

Android, iOS, Web e GPT devem reutilizar esse contrato.
