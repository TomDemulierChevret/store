import { InjectionToken } from '@angular/core';
import { Observable, of } from 'rxjs';

export const enum StorageOption {
  LocalStorage,
  SessionStorage
}

export interface NgxsStoragePluginOptions {
  /**
   * Key for the state slice to store in the storage engine.
   */
  key?: string | string[] | undefined;

  /**
   * Storage engine to use. Deaults to localStorage but can provide
   *
   * sessionStorage or custom implementation of the StorageEngine interface
   */
  storage?: StorageOption;

  /**
   * Migration strategies.
   */
  migrations?: {
    /**
     * Version to key off.
     */
    version: number | string;

    /**
     * Method to migrate the previous state.
     */
    migrate: (state: any) => any;

    /**
     * Key to migrate.
     */
    key?: string;

    /**
     * Key for the version. Defaults to 'version'.
     */
    versionKey?: string;
  }[];

  /**
   * Serailizer for the object before its pushed into the engine.
   */
  serialize?(obj: any);

  /**
   * Deserializer for the object before its pulled out of the engine.
   */
  deserialize?(obj: any);
}

export const NGXS_STORAGE_PLUGIN_OPTIONS = new InjectionToken('NGXS_STORAGE_PLUGIN_OPTION');

export const STORAGE_ENGINE = new InjectionToken('STORAGE_ENGINE');

/**
 * StorageEngine API is similar to the WebStorage API (localStorage or sessionStorage) but can be used with asynchronous
 * storage engines such as IndexedDB
 */
export interface StorageEngine {
  length(): Observable<number>;
  getItem(key): Observable<any>;
  setItem(key, val): void;
  removeItem(key): void;
  clear(): void;
  key(val: number): Observable<string>;
}

/**
 * This wrapper allow to use the new StorageEngine API with existing synchronous WebStorage engines (localStorage and sessionStorage)
 */
export class WebStorageWrapper implements StorageEngine {
  constructor(private _storage: Storage) {}

  length(): Observable<number> {
    return of(this._storage.length);
  }

  getItem(key): Observable<any> {
    return of(this._storage.getItem(key));
  }

  setItem(key, val): void {
    this._storage.setItem(key, val);
  }

  removeItem(key): void {
    this._storage.removeItem(key);
  }

  clear(): void {
    this._storage.clear();
  }

  key(val: number): Observable<string> {
    return of(this._storage.key(val));
  }
}
