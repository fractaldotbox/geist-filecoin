import { Hono } from 'hono';
import { makeAdapter } from '@livestore/adapter-node';
import { createStorePromise, Store } from '@livestore/livestore';
import { makeCfSync } from '@livestore/sync-cf';
import { serve } from '@hono/node-server'
import { events, schema, tables } from './schema';

const app = new Hono();

// TODO
const AUTH_TOKEN = 'insecure-token-change-me';



class StoreSingleton {
  private static store: Store;

  public static async getInstance(): Promise<Store> {

    if(this.store) {
      return this.store;
    }

      const adapter = makeAdapter({
        storage: { type: 'in-memory' }, // Use in-memory storage for containers
        sync: { 
          backend: makeCfSync({
            url: 'https://geist-livestore-sync-worker.debuggingfuturecors.workers.dev',
          }),
          initialSyncOptions: {
            _tag: 'Blocking',
            timeout: 10000,
          }
        }
      });
      const store = await createStorePromise({
        adapter,
        schema,
        storeId: 'test',
        syncPayload: { authToken: AUTH_TOKEN  },
      })

      this.store = store;
      return store;
    

  }
}

app.get('/hello', (c) => {
  return c.text('Hello World');
});
app.get('/container/:id', (c) => {
  return c.text('Hello ');
});

app.get('/container', (c) => {
  return c.text('Hello Container ');
});

app.get('/sync', async (c) => {
  console.log('Syncing');

  try {
 
    const store = await StoreSingleton.getInstance();
    const entries = store.query(tables.entries)
  
    return c.json(entries);

  } catch (e) {
    console.error(e);
  

    return c.text('Error', e.message);
  
  }

});

const port = 8080;

serve({
  fetch: app.fetch,
  port,
})
