Testiram

1. Server: npm run dev
2. Client: npm run client

2. Preverim token v datoteki: cat .auth/test-client-token.json


3. Bez tokena - 401 Unauthorized
   http://localhost:3000/api/goals


4. S tokenom - 200 OK
   curl http://localhost:3000/api/goals \
     -H "Authorization: Bearer <TOKEN>"


OAuth Token Endpoint - novega generiram

curl -X POST http://localhost:3000/oauth/token \
  -H "Authorization: Basic $(echo -n 'studysprint-cli:studysprint-secret' | base64)" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials"


TEST ZA GOALS:
(Unauthorized)
1. curl http://localhost:3000/api/goals

(S Tokenom)
2. TOKEN="<token_iz_Test_2>"
curl http://localhost:3000/api/goals -H "Authorization: Bearer $TOKEN"
