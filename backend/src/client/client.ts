import axios from 'axios';

const BASE = 'http://localhost:3000';

async function demo() {
  console.log('=== StudySprint API Odjemalec ===\n');

  // POST – registracija novega uporabnika
  console.log('1. POST /users – Registracija uporabnika');
  const createRes = await axios.post(`${BASE}/users`, {
    name: 'Janez Novak',
    email: `janez_${Date.now()}@example.com`,
    password: 'geslo123',
    role: 'user',
  });
  const user = createRes.data;
  console.log('   Ustvarjen:', user);

  // GET – pridobi vse uporabnike
  console.log('\n2. GET /users – Seznam vseh uporabnikov');
  const listRes = await axios.get(`${BASE}/users`);
  console.log(`   Skupaj uporabnikov: ${listRes.data.length}`);

  // PUT – posodobitev uporabnika
  console.log(`\n3. PUT /users/${user.id} – Posodobitev uporabnika`);
  const updateRes = await axios.put(`${BASE}/users/${user.id}`, { name: 'Janez Posodobljen' });
  console.log('   Posodobljeno:', updateRes.data);

  // POST – ustvari cilj
  console.log('\n4. POST /goals – Ustvari učni cilj');
  const goalRes = await axios.post(`${BASE}/goals`, {
    title: 'Naučiti se Node.js',
    description: 'Osnove Express in TypeScript',
    deadline: '2025-06-01',
    userId: user.id,
  });
  const goal = goalRes.data;
  console.log('   Cilj:', goal);

  // POST – ustvari nalogo
  console.log('\n5. POST /tasks – Ustvari nalogo');
  const taskRes = await axios.post(`${BASE}/tasks`, {
    title: 'Preberi dokumentacijo Express',
    description: 'Express.js uradna dokumentacija',
    deadline: '2025-05-15',
    goalId: goal.id,
    userId: user.id,
    completed: false,
  });
  const task = taskRes.data;
  console.log('   Naloga:', task);

  // PUT – označi nalogo kot opravljeno
  console.log(`\n6. PUT /tasks/${task.id} – Naloga opravljena`);
  const doneRes = await axios.put(`${BASE}/tasks/${task.id}`, { completed: true });
  console.log('   Posodobljeno:', doneRes.data);

  // GET – napredek
  console.log(`\n7. GET /progress/${user.id} – Napredek uporabnika`);
  const progressRes = await axios.get(`${BASE}/progress/${user.id}`);
  console.log('   Napredek:', progressRes.data);

  // DELETE – izbriši testno nalogo
  console.log(`\n8. DELETE /tasks/${task.id} – Izbriši nalogo`);
  const delTaskRes = await axios.delete(`${BASE}/tasks/${task.id}`);
  console.log('  ', delTaskRes.data.message);

  // DELETE – izbriši testnega uporabnika
  console.log(`\n9. DELETE /users/${user.id} – Počisti testnega uporabnika`);
  const delRes = await axios.delete(`${BASE}/users/${user.id}`);
  console.log('  ', delRes.data.message);

  console.log('\n=== Demo zaključen ===');
}

demo().catch(err => {
  console.error('Napaka:', err.response?.data ?? err.message);
  process.exit(1);
});
