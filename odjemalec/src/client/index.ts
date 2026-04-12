import axios from "axios";
import { installOAuth } from "./oauth";

const api = axios.create({
  baseURL: process.env.API_URL ?? "http://127.0.0.1:3000/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

function print(label: string, payload: unknown): void {
  console.log(`\n${label}`);
  console.log(JSON.stringify(payload, null, 2));
}

async function run(): Promise<void> {
  // Initialize OAuth before making any API requests
  await installOAuth(api);

  const suffix = Date.now();

  const createdGoal = await api.post("/goals", {
    title: `Cilj ${suffix}`,
    description: "Priprava na izpit",
    deadline: "2026-05-01T20:00:00.000Z",
    priority: "high",
    status: "planned",
    userId: "u-1",
  });
  const goalId = createdGoal.data.data.id as string;
  print("POST /goals", createdGoal.data);

  const listGoals = await api.get("/goals");
  print("GET /goals", listGoals.data);

  const updatedGoal = await api.put(`/goals/${goalId}`, {
    title: `Cilj ${suffix} (posodobljen)`,
    description: "Priprava na izpit in vaje",
    deadline: "2026-05-03T20:00:00.000Z",
    priority: "high",
    status: "in_progress",
    userId: "u-1",
  });
  print("PUT /goals/:id", updatedGoal.data);

  const createdTask = await api.post("/tasks", {
    title: `Naloga ${suffix}`,
    description: "Reši 10 nalog",
    deadline: "2026-04-10T18:00:00.000Z",
    status: "planned",
    estimatedMinutes: 80,
    goalId,
  });
  const taskId = createdTask.data.data.id as string;
  print("POST /tasks", createdTask.data);

  const deletedTask = await api.delete(`/tasks/${taskId}`);
  print("DELETE /tasks/:id", deletedTask.data);

  const deletedGoal = await api.delete(`/goals/${goalId}`);
  print("DELETE /goals/:id", deletedGoal.data);

  const syncResult = await api.post("/sync", {
    userId: "u-1",
    localChanges: [
      { entity: "goals", operation: "update", id: goalId },
      { entity: "tasks", operation: "delete", id: taskId },
    ],
  });
  print("POST /sync", syncResult.data);

  console.log("\nOdjemalec je uspešno izvedel GET/POST/PUT/DELETE tok s OAuth avtentikacijo.");
}

run().catch((error: unknown) => {
  if (axios.isAxiosError(error)) {
    console.error(error.response?.status, error.response?.data ?? error.message);
  } else {
    console.error(error);
  }
  process.exit(1);
});
