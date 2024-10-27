import { serve } from '@hono/node-server'
import { Hono } from 'hono';
import { XRPC, CredentialManager, AtpSessionData } from '@atcute/client';
import '@atcute/bluesky/lexicons';
import { getPost } from './routes/getPost';
import { getPostData } from './routes/getPostData';
import { getOEmbed } from './routes/getOEmbed';
import { getProfileData } from './routes/getProfileData';
import { getProfile } from './routes/getProfile';
import { HTTPException } from 'hono/http-exception';
const NodeCache = require( "node-cache" );

const app = new Hono();
const myCache = new NodeCache();

app.use('*', async (c, next) => {
  const creds = new CredentialManager({
    service: process.env.BSKY_SERVICE_URL,
    onRefresh(session) {
      return myCache.set('session', JSON.stringify(session));
    },
    onExpired(session) {
      return myCache.del('session');
    },
    onSessionUpdate(session) {
      return myCache.set('session', JSON.stringify(session));
    },
  });
  const agent = new XRPC({ handler: creds });
  try {
    const rawSession = myCache.get('session');
    if(rawSession) {
      const session = JSON.parse(rawSession) as AtpSessionData;
      await creds.resume(session);
    } else {
      await creds.login({
        identifier: process.env.BSKY_AUTH_USERNAME,
        password: process.env.BSKY_AUTH_PASSWORD,
      });
    }
    c.set('Agent', agent);
  } catch (error) {
    const err = new Error('Failed to login to Bluesky!', {
      cause: error,
    });
    throw new HTTPException(500, {
      message: `${err.message} \n\n ${err.cause} \n\n ${err.stack}`,
    });
  }
  return next();
});

app.get('/', async (c) => {
  return c.redirect(process.env.EMPTY_REDIR);
});

app.get('/profile/:user/post/:post', getPost);
app.get('/https://bsky.app/profile/:user/post/:post', getPost);

app.get('/profile/:user/post/:post/json', getPostData);
app.get('/https://bsky.app/profile/:user/post/:post/json', getPostData);

app.get('/profile/:user', getProfile);
app.get('/https://bsky.app/profile/:user', getProfile);

app.get('/profile/:user/json', getProfileData);
app.get('/https://bsky.app/profile/:user/json', getProfileData);

app.get('/oembed', getOEmbed);

serve({
  fetch: app.fetch,
  port: process.env.PORT,
})
