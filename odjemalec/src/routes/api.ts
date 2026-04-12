import { Request, Response, Router } from "express";
import { requireOAuth } from "../middleware/require-oauth";
import { generateId, ResourceName, store } from "../data/store";

export const apiRouter = Router();

// Apply OAuth authentication to all API routes
apiRouter.use(requireOAuth);

type IdEntity = { id: string };

function listHandler(resource: ResourceName) {
  return (_req: Request, res: Response) => {
    res.json({ success: true, data: store[resource] });
  };
}

function getHandler(resource: ResourceName) {
  return (req: Request, res: Response) => {
    const found = (store[resource] as IdEntity[]).find((entry) => entry.id === req.params.id);
    if (!found) {
      res.status(404).json({ success: false, message: `${resource} with id ${req.params.id} was not found` });
      return;
    }
    res.json({ success: true, data: found });
  };
}

function createHandler(resource: ResourceName, prefix: string) {
  return (req: Request, res: Response) => {
    const record = { id: generateId(prefix), ...req.body };
    (store[resource] as IdEntity[]).push(record as IdEntity);
    res.status(201).json({ success: true, data: record });
  };
}

function putHandler(resource: ResourceName) {
  return (req: Request, res: Response) => {
    const items = store[resource] as IdEntity[];
    const index = items.findIndex((entry) => entry.id === req.params.id);
    if (index < 0) {
      res.status(404).json({ success: false, message: `${resource} with id ${req.params.id} was not found` });
      return;
    }
    const updated = { id: req.params.id, ...req.body };
    items[index] = updated;
    res.json({ success: true, data: updated });
  };
}

function deleteHandler(resource: ResourceName) {
  return (req: Request, res: Response) => {
    const items = store[resource] as IdEntity[];
    const index = items.findIndex((entry) => entry.id === req.params.id);
    if (index < 0) {
      res.status(404).json({ success: false, message: `${resource} with id ${req.params.id} was not found` });
      return;
    }
    const [removed] = items.splice(index, 1);
    res.json({ success: true, data: removed });
  };
}

function mountCrud(resource: ResourceName, route: string, prefix: string) {
  apiRouter.get(route, listHandler(resource));
  apiRouter.get(`${route}/:id`, getHandler(resource));
  apiRouter.post(route, createHandler(resource, prefix));
  apiRouter.put(`${route}/:id`, putHandler(resource));
  apiRouter.delete(`${route}/:id`, deleteHandler(resource));
}

mountCrud("users", "/users", "user");
mountCrud("goals", "/goals", "goal");
mountCrud("tasks", "/tasks", "task");
mountCrud("sprints", "/sprints", "sprint");
mountCrud("progress", "/progress", "progress");
mountCrud("reminders", "/reminders", "reminder");
mountCrud("groups", "/groups", "group");
mountCrud("memberships", "/memberships", "member");
mountCrud("challenges", "/challenges", "challenge");

apiRouter.post("/sync", (req: Request, res: Response) => {
  const localChanges = Array.isArray(req.body?.localChanges) ? req.body.localChanges : [];
  res.json({
    success: true,
    data: {
      syncedAt: new Date().toISOString(),
      acceptedChanges: localChanges.length,
      serverMessage: "Sinhronizacija uspešna.",
    },
  });
});
