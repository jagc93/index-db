import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class IndexDBService {

  private db: IDBDatabase | null = null;
  private databaseName: string = 'database';
  private storeName: string = 'my-store';

  constructor() { }

  public async openDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(this.databaseName, 1);
      request.onerror = () => {
        reject('Error opening database');
      };
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        this.db = (event.target as any).result;
        console.log('Database upgrade needed');

        // Verificar si el almacén de objetos existe
        if (!this.db?.objectStoreNames.contains(this.storeName)) {
          // Si no existe, crear el almacén de objetos
          this.db?.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
          console.log('Object store created');
        }
      };
    });
  }

  public closeDB(): void {
    this.db?.close();
    this.db = null;
  }

  public deleteDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.databaseName);

      request.onerror = () => {
        reject('Error opening database');
      };

      request.onsuccess = () => {
        const db = request.result;
        db.close(); // Cerramos la base de datos porque solo necesitamos verificar si existe

        // Ahora intentamos eliminar la base de datos
        const deleteRequest = indexedDB.deleteDatabase(this.databaseName);

        deleteRequest.onerror = () => {
          reject('Error deleting database');
        };

        deleteRequest.onsuccess = () => {
          resolve();
        };
      };
    });
  }

  public async addData(data: any): Promise<IDBValidKey> {
    return new Promise<IDBValidKey>((resolve, reject) => {
      if (!this.db) {
        reject('Database not open');
        return;
      }
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.add(data);
      request.onerror = (event) => {
        reject('Error adding data');
      };
      request.onsuccess = () => {
        const key = request.result;
        resolve(key);
      };
    });
  }

  public async updateData(key: IDBValidKey, newData: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.db) {
        reject('Database not open');
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const getRequest = store.get(key);
      getRequest.onsuccess = (event) => {
        const existingData = getRequest.result;
        if (!existingData) {
          reject('Data not found');
          return;
        }

        // Update the existing data with newData
        const updatedData = { ...existingData, ...newData };

        // Put the updated data back into the store
        const updateRequest = store.put(updatedData, key);
        updateRequest.onsuccess = () => {
          resolve();
        };
        updateRequest.onerror = () => {
          reject('Error updating data');
        };
      };

      getRequest.onerror = () => {
        reject('Error retrieving data');
      };
    });
  }

  public async deleteData(key: IDBValidKey): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.db) {
        reject('Database not open');
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      // Usa el método delete para eliminar la entrada correspondiente al key proporcionado.
      const request = store.delete(key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject('Error deleting data');
      };
    });
  }

  public async getData(id: IDBValidKey): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject('Database not open');
        return;
      }
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);
      request.onerror = (event) => {
        reject('Error getting data');
      };
      request.onsuccess = (event) => {
        resolve(request.result);
      };
    });
  }

  public async getAllData(): Promise<{ key: IDBValidKey, value: any[] }[]> {
    return new Promise<{ key: IDBValidKey, value: any }[]>((resolve, reject) => {
      if (!this.db) {
        reject('Database not open');
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.openCursor();

      const results: { key: IDBValidKey, value: any }[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          results.push({ key: cursor.primaryKey, value: cursor.value });
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => {
        reject('Error getting data');
      };
    });
  }
}
