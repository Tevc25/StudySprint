import axios from 'axios';

const BASE = 'http://localhost:3000';

async function demo() {
  console.log('=== StudySprint API Odjemalec (OAuth 2.0) ===\n');

  // --- REGISTRACIJA ---
  console.log('1. POST /users – Registracija uporabnika');
  const email = `janez_${Date.now()}@example.com`;
  const password = 'geslo123';
  const createRes = await axios.post(`${BASE}/users`, {
    name: 'Janez Novak',
    email,
    password,
    role: 'user',
  });
  const user = createRes.data;
  console.log('   Ustvarjen:', user);

  // --- OAuth 2.0: pridobitev žetona (Resource Owner Password Credentials Grant) ---
  console.log('\n2. POST /auth/token – Pridobitev OAuth 2.0 žetona');
  const tokenRes = await axios.post(`${BASE}/auth/token`, {
    grant_type: 'password',
    username: email,
    password,
    client_id: 'studysprint-client',
  });
  const { access_token, token_type, expires_in } = tokenRes.data;
  console.log(`   Žeton pridobljen (${token_type}, velja ${expires_in}s)`);
  console.log(`   access_token: ${access_token.slice(0, 40)}...`);

  // Axios instanca s prednastavitvijo avtorizacijskega glave
  const api = axios.create({
    baseURL: BASE,
    headers: { Authorization: `Bearer ${access_token}` },
  });

  // --- Zaščitene poti (zahtevajo Bearer žeton) ---

  console.log('\n3. GET /users – Seznam vseh uporabnikov');
  const listRes = await axios.get(`${BASE}/users`);
  console.log(`   Skupaj uporabnikov: ${listRes.data.length}`);

  console.log(`\n4. PUT /users/${user.id} – Posodobitev uporabnika`);
  const updateRes = await axios.put(`${BASE}/users/${user.id}`, { name: 'Janez Posodobljen' });
  console.log('   Posodobljeno:', updateRes.data);

  console.log('\n5. POST /goals – Ustvari učni cilj (zaščiteno)');
  const goalRes = await api.post('/goals', {
    title: 'Naučiti se Node.js',
    description: 'Osnove Express in TypeScript',
    deadline: '2025-06-01',
    userId: user.id,
  });
  const goal = goalRes.data;
  console.log('   Cilj:', goal);

  console.log('\n6. POST /tasks – Ustvari nalogo (zaščiteno)');
  const taskRes = await api.post('/tasks', {
    title: 'Preberi dokumentacijo Express',
    description: 'Express.js uradna dokumentacija',
    deadline: '2025-05-15',
    goalId: goal.id,
    userId: user.id,
    completed: false,
  });
  const task = taskRes.data;
  console.log('   Naloga:', task);

  console.log(`\n7. PUT /tasks/${task.id} – Naloga opravljena (zaščiteno)`);
  const doneRes = await api.put(`/tasks/${task.id}`, { completed: true });
  console.log('   Posodobljeno:', doneRes.data);

  console.log(`\n8. GET /progress/${user.id} – Napredek uporabnika (zaščiteno)`);
  const progressRes = await api.get(`/progress/${user.id}`);
  console.log('   Napredek:', progressRes.data);

  // --- Preizkus zavrnjenega dostopa brez žetona ---
  console.log('\n9. GET /goals – Brez žetona (pričakujemo 401)');
  try {
    await axios.get(`${BASE}/goals`);
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response) {
      console.log(`   Status: ${err.response.status} – ${JSON.stringify(err.response.data)}`);
    }
  }

  // --- Čiščenje ---
  console.log(`\n10. DELETE /tasks/${task.id} – Izbriši nalogo (zaščiteno)`);
  const delTaskRes = await api.delete(`/tasks/${task.id}`);
  console.log('   ', delTaskRes.data.message);

  console.log(`\n11. DELETE /users/${user.id} – Počisti testnega uporabnika`);
  const delRes = await axios.delete(`${BASE}/users/${user.id}`);
  console.log('   ', delRes.data.message);

  console.log('\n=== Demo zaključen ===');
}

demo().catch(err => {
  console.error('Napaka:', err.response?.data ?? err.message);
  process.exit(1);
});
