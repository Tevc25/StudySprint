import { store } from '../store';
import { EntityCollections } from '../types';

export class BaseRepository<K extends keyof EntityCollections> {
  constructor(private readonly collectionName: K) {}

  public findAll(): EntityCollections[K][] {
    return this.collection;
  }

  public findById(id: string): EntityCollections[K] | undefined {
    return this.collection.find((item) => item.id === id);
  }

  public exists(id: string): boolean {
    return this.collection.some((item) => item.id === id);
  }

  public findOne(predicate: (item: EntityCollections[K]) => boolean): EntityCollections[K] | undefined {
    return this.collection.find(predicate);
  }

  public create(item: EntityCollections[K]): EntityCollections[K] {
    this.collection.push(item);
    return item;
  }

  public update(id: string, nextItem: EntityCollections[K]): EntityCollections[K] | undefined {
    const index = this.collection.findIndex((item) => item.id === id);

    if (index === -1) {
      return undefined;
    }

    this.collection[index] = nextItem;
    return this.collection[index];
  }

  public delete(id: string): boolean {
    const index = this.collection.findIndex((item) => item.id === id);

    if (index === -1) {
      return false;
    }

    this.collection.splice(index, 1);
    return true;
  }

  private get collection(): EntityCollections[K][] {
    return store.getCollection(this.collectionName);
  }
}
