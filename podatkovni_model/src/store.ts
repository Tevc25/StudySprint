import { seedData } from './data/seed';
import { EntityCollections } from './types';

type CollectionsState = { [K in keyof EntityCollections]: EntityCollections[K][] };

const cloneState = (state: CollectionsState): CollectionsState => {
  return JSON.parse(JSON.stringify(state)) as CollectionsState;
};

class InMemoryStore {
  private state: CollectionsState;

  constructor(initialState: CollectionsState) {
    this.state = cloneState(initialState);
  }

  public getCollection<K extends keyof EntityCollections>(key: K): EntityCollections[K][] {
    return this.state[key];
  }

  public reset(): void {
    this.state = cloneState(seedData);
  }
}

export const store = new InMemoryStore(seedData);
