export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "StudySprint - Clan 1 REST API",
    version: "1.0.0",
    description: "REST storitve za odjemalski del: cilji, naloge, sprinti, napredek, opomniki in skupine.",
  },
  servers: [
    {
      url: "http://127.0.0.1:3000",
      description: "Local development",
    },
  ],
  tags: [
    { name: "Users" },
    { name: "Goals" },
    { name: "Tasks" },
    { name: "Sprints" },
    { name: "Progress" },
    { name: "Reminders" },
    { name: "Groups" },
    { name: "Memberships" },
    { name: "Challenges" },
    { name: "Sync" },
  ],
  paths: {
    "/api/users": {
      get: { tags: ["Users"], summary: "Vrne vse uporabnike" },
      post: { tags: ["Users"], summary: "Ustvari uporabnika" },
    },
    "/api/users/{id}": {
      get: { tags: ["Users"], summary: "Vrne uporabnika po ID" },
      put: { tags: ["Users"], summary: "Posodobi uporabnika" },
      delete: { tags: ["Users"], summary: "Izbrise uporabnika" },
    },
    "/api/goals": {
      get: { tags: ["Goals"], summary: "Vrne vse ucne cilje" },
      post: { tags: ["Goals"], summary: "Ustvari ucni cilj" },
    },
    "/api/goals/{id}": {
      get: { tags: ["Goals"], summary: "Vrne cilj po ID" },
      put: { tags: ["Goals"], summary: "Posodobi cilj" },
      delete: { tags: ["Goals"], summary: "Izbrise cilj" },
    },
    "/api/tasks": {
      get: { tags: ["Tasks"], summary: "Vrne vse naloge" },
      post: { tags: ["Tasks"], summary: "Ustvari nalogo" },
    },
    "/api/tasks/{id}": {
      get: { tags: ["Tasks"], summary: "Vrne nalogo po ID" },
      put: { tags: ["Tasks"], summary: "Posodobi nalogo" },
      delete: { tags: ["Tasks"], summary: "Izbrise nalogo" },
    },
    "/api/sprints": {
      get: { tags: ["Sprints"], summary: "Vrne vse sprinte" },
      post: { tags: ["Sprints"], summary: "Ustvari sprint" },
    },
    "/api/sprints/{id}": {
      get: { tags: ["Sprints"], summary: "Vrne sprint po ID" },
      put: { tags: ["Sprints"], summary: "Posodobi sprint" },
      delete: { tags: ["Sprints"], summary: "Izbrise sprint" },
    },
    "/api/progress": {
      get: { tags: ["Progress"], summary: "Vrne napredek" },
      post: { tags: ["Progress"], summary: "Ustvari zapis napredka" },
    },
    "/api/progress/{id}": {
      get: { tags: ["Progress"], summary: "Vrne zapis napredka po ID" },
      put: { tags: ["Progress"], summary: "Posodobi zapis napredka" },
      delete: { tags: ["Progress"], summary: "Izbrise zapis napredka" },
    },
    "/api/reminders": {
      get: { tags: ["Reminders"], summary: "Vrne vse opomnike" },
      post: { tags: ["Reminders"], summary: "Ustvari opomnik" },
    },
    "/api/reminders/{id}": {
      get: { tags: ["Reminders"], summary: "Vrne opomnik po ID" },
      put: { tags: ["Reminders"], summary: "Posodobi opomnik" },
      delete: { tags: ["Reminders"], summary: "Izbrise opomnik" },
    },
    "/api/groups": {
      get: { tags: ["Groups"], summary: "Vrne vse skupine" },
      post: { tags: ["Groups"], summary: "Ustvari skupino" },
    },
    "/api/groups/{id}": {
      get: { tags: ["Groups"], summary: "Vrne skupino po ID" },
      put: { tags: ["Groups"], summary: "Posodobi skupino" },
      delete: { tags: ["Groups"], summary: "Izbrise skupino" },
    },
    "/api/memberships": {
      get: { tags: ["Memberships"], summary: "Vrne clanstva" },
      post: { tags: ["Memberships"], summary: "Ustvari clanstvo" },
    },
    "/api/memberships/{id}": {
      get: { tags: ["Memberships"], summary: "Vrne clanstvo po ID" },
      put: { tags: ["Memberships"], summary: "Posodobi clanstvo" },
      delete: { tags: ["Memberships"], summary: "Izbrise clanstvo" },
    },
    "/api/challenges": {
      get: { tags: ["Challenges"], summary: "Vrne skupinske izzive" },
      post: { tags: ["Challenges"], summary: "Ustvari skupinski izziv" },
    },
    "/api/challenges/{id}": {
      get: { tags: ["Challenges"], summary: "Vrne izziv po ID" },
      put: { tags: ["Challenges"], summary: "Posodobi izziv" },
      delete: { tags: ["Challenges"], summary: "Izbrise izziv" },
    },
    "/api/sync": {
      post: { tags: ["Sync"], summary: "Sinhronizacija lokalnih sprememb" },
    },
  },
} as const;
