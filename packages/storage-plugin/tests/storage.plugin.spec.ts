import { TestBed } from '@angular/core/testing';

import { Action, NgxsModule, NgxsOnInit, State, Store } from '@ngxs/store';

import { NgxsStoragePluginModule, STORAGE_ENGINE, StorageEngine, StorageOption } from '../';
import { Observable, of } from 'rxjs';

describe('NgxsStoragePlugin', () => {
  class Increment {
    static type = 'INCREMENT';
  }

  class Decrement {
    static type = 'DECREMENT';
  }

  interface StateModel {
    count: number;
  }

  @State<StateModel>({
    name: 'counter',
    defaults: { count: 0 }
  })
  class MyStore {
    @Action(Increment)
    increment({ getState, setState }) {
      setState({
        count: Number(getState().count) + 1
      });
    }

    @Action(Decrement)
    decrement({ getState, setState }) {
      setState({
        count: Number(getState().count) - 1
      });
    }
  }

  @State<StateModel>({
    name: 'lazyLoaded',
    defaults: { count: 0 }
  })
  class LazyLoadedStore {}

  afterEach(() => {
    localStorage.removeItem('@@STATE');
    sessionStorage.removeItem('@@STATE');
  });

  it('should get initial data from localstorage', () => {
    localStorage.setItem('@@STATE', JSON.stringify({ counter: { count: 100 } }));

    TestBed.configureTestingModule({
      imports: [NgxsModule.forRoot([MyStore]), NgxsStoragePluginModule.forRoot()]
    });

    const store = TestBed.get(Store);

    store
      .select(state => state.counter)
      .subscribe((state: StateModel) => {
        expect(state.count).toBe(100);
      });
  });

  it('should save data to localstorage', () => {
    localStorage.setItem('@@STATE', JSON.stringify({ counter: { count: 100 } }));

    TestBed.configureTestingModule({
      imports: [NgxsModule.forRoot([MyStore]), NgxsStoragePluginModule.forRoot()]
    });

    const store = TestBed.get(Store);

    store.dispatch(new Increment());
    store.dispatch(new Increment());
    store.dispatch(new Increment());
    store.dispatch(new Increment());
    store.dispatch(new Increment());

    store
      .select(state => state.counter)
      .subscribe((state: StateModel) => {
        expect(state.count).toBe(105);

        expect(localStorage.getItem('@@STATE')).toBe(JSON.stringify({ counter: { count: 105 } }));
      });
  });

  it('should migrate global localstorage', () => {
    const data = JSON.stringify({ counter: { count: 100, version: 1 } });
    localStorage.setItem('@@STATE', data);

    TestBed.configureTestingModule({
      imports: [
        NgxsModule.forRoot([MyStore]),
        NgxsStoragePluginModule.forRoot({
          migrations: [
            {
              version: 1,
              versionKey: 'counter.version',
              migrate: state => {
                state.counter = {
                  counts: state.counter.count,
                  version: 2
                };
                return state;
              }
            }
          ]
        })
      ]
    });

    const store = TestBed.get(Store);

    store
      .select(state => state.counter)
      .subscribe((state: StateModel) => {
        expect(localStorage.getItem('@@STATE')).toBe(JSON.stringify({ counter: { counts: 100, version: 2 } }));
      });
  });

  it('should migrate single localstorage', () => {
    const data = JSON.stringify({ count: 100, version: 1 });
    localStorage.setItem('counter', data);

    TestBed.configureTestingModule({
      imports: [
        NgxsModule.forRoot([MyStore]),
        NgxsStoragePluginModule.forRoot({
          key: 'counter',
          migrations: [
            {
              version: 1,
              key: 'counter',
              versionKey: 'version',
              migrate: state => {
                state = {
                  counts: state.count,
                  version: 2
                };
                return state;
              }
            }
          ]
        })
      ]
    });

    const store = TestBed.get(Store);

    store
      .select(state => state.counter)
      .subscribe((state: StateModel) => {
        expect(localStorage.getItem('counter')).toBe(JSON.stringify({ counts: 100, version: 2 }));
      });
  });

  it('should correct get data from session storage', () => {
    sessionStorage.setItem('@@STATE', JSON.stringify({ counter: { count: 100 } }));

    TestBed.configureTestingModule({
      imports: [
        NgxsModule.forRoot([MyStore]),
        NgxsStoragePluginModule.forRoot({
          storage: StorageOption.SessionStorage
        })
      ]
    });

    const store = TestBed.get(Store);

    store
      .select(state => state.counter)
      .subscribe((state: StateModel) => {
        expect(state.count).toBe(100);
      });
  });

  it('should save data to sessionStorage', () => {
    sessionStorage.setItem('@@STATE', JSON.stringify({ counter: { count: 100 } }));

    TestBed.configureTestingModule({
      imports: [
        NgxsModule.forRoot([MyStore]),
        NgxsStoragePluginModule.forRoot({
          storage: StorageOption.SessionStorage
        })
      ]
    });

    const store = TestBed.get(Store);

    store.dispatch(new Increment());
    store.dispatch(new Increment());
    store.dispatch(new Increment());
    store.dispatch(new Increment());
    store.dispatch(new Increment());

    store
      .select(state => state.counter)
      .subscribe((state: StateModel) => {
        expect(state.count).toBe(105);

        expect(sessionStorage.getItem('@@STATE')).toBe(JSON.stringify({ counter: { count: 105 } }));
      });
  });

  it('should use a custom storage engine', () => {
    class CustomStorage implements StorageEngine {
      static Storage: any = {
        '@@STATE': {
          counter: {
            count: 100
          }
        }
      };

      length() {
        return of(Object.keys(CustomStorage.Storage).length);
      }

      getItem(key) {
        return of(CustomStorage.Storage[key]);
      }

      setItem(key, val) {
        CustomStorage.Storage[key] = val;
      }

      removeItem(key) {
        delete CustomStorage.Storage[key];
      }

      clear() {
        CustomStorage.Storage = {};
      }

      key(index) {
        return of(Object.keys(CustomStorage.Storage)[index]);
      }
    }

    TestBed.configureTestingModule({
      imports: [
        NgxsModule.forRoot([MyStore]),
        NgxsStoragePluginModule.forRoot({
          serialize(val) {
            return val;
          },
          deserialize(val) {
            return val;
          }
        })
      ],
      providers: [
        {
          provide: STORAGE_ENGINE,
          useClass: CustomStorage
        }
      ]
    });

    const store = TestBed.get(Store);

    store.dispatch(new Increment());
    store.dispatch(new Increment());
    store.dispatch(new Increment());
    store.dispatch(new Increment());
    store.dispatch(new Increment());

    store
      .select(state => state.counter)
      .subscribe((state: StateModel) => {
        expect(state.count).toBe(105);

        expect(CustomStorage.Storage['@@STATE']).toEqual({ counter: { count: 105 } });
      });
  });

  it('should merge unloaded data from feature with local storage', () => {
    localStorage.setItem('@@STATE', JSON.stringify({ counter: { count: 100 } }));

    TestBed.configureTestingModule({
      imports: [
        NgxsModule.forRoot([MyStore]),
        NgxsStoragePluginModule.forRoot(),
        NgxsModule.forFeature([LazyLoadedStore])
      ]
    });

    const store = TestBed.get(Store);

    store
      .select(state => state)
      .subscribe((state: { counter: StateModel; lazyLoaded: StateModel }) => {
        expect(state.lazyLoaded).toBeDefined();
      });
  });

  it('should save data to IndexedDB using a custom storage engine', done => {
    let db;
    const objectStore = 'store';

    @State<StateModel>({
      name: 'counter',
      defaults: { count: 0 }
    })
    class AsyncStore extends MyStore implements NgxsOnInit {
      ngxsOnInit() {
        const store = TestBed.get(Store);

        store.dispatch(new Increment());
        store.dispatch(new Increment());
        store.dispatch(new Increment());
        store.dispatch(new Increment());
        store.dispatch(new Increment());

        store
          .select(state => state.counter)
          .subscribe((state: StateModel) => {
            expect(state.count).toBe(105);

            const request = db
              .transaction(objectStore, 'readonly')
              .objectStore(objectStore)
              .get('@@STATE');
            request.onsuccess = () => {
              expect(request.result).toEqual({ counter: { count: 105 } });
              done();
            };
          });
      }
    }

    class IndexedDBStorage implements StorageEngine {
      getItem(key): Observable<any> {
        const request = db
          .transaction(objectStore, 'readonly')
          .objectStore(objectStore)
          .get(key);
        return Observable.create(observer => {
          request.onerror = err => observer.error(err);
          request.onsuccess = () => {
            observer.next(request.result);
            observer.complete();
          };
        });
      }

      setItem(key, val) {
        const request = db
          .transaction(objectStore, 'readwrite')
          .objectStore(objectStore)
          .put(val, key);
        request.onsuccess = () => console.log('setItem');
      }

      clear(): void {}

      key(val: number): Observable<string> {
        return undefined;
      }

      length(): Observable<number> {
        return undefined;
      }

      removeItem(key): void {}
    }

    const dbInit = window.indexedDB.open('testStorage', 1);
    dbInit.onupgradeneeded = (event: any) => {
      db = event.target.result;
      const objectStoreInit = db.createObjectStore(objectStore, { autoIncrement: true });
      objectStoreInit.transaction.oncomplete = () => {
        const stateInit = db
          .transaction(objectStore, 'readwrite')
          .objectStore(objectStore)
          .add({ counter: { count: 100 } }, '@@STATE');
        stateInit.onsuccess = () => {
          TestBed.configureTestingModule({
            imports: [
              NgxsModule.forRoot([AsyncStore]),
              NgxsStoragePluginModule.forRoot({
                serialize(val) {
                  return val;
                },
                deserialize(val) {
                  return val;
                }
              })
            ],
            providers: [
              {
                provide: STORAGE_ENGINE,
                useClass: IndexedDBStorage
              }
            ]
          });

          TestBed.get(Store);
        };
      };
    };
  });
});
