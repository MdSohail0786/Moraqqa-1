/**
 * Short public Cache-Control on anonymous GET responses. Requests that carry credentials
 * (the admin panel) are never cached, so uploads and edits show up immediately.
 */
export const cache = (seconds = 60) => (req, res, next) => {
  res.vary('Authorization');
  if (req.method === 'GET' && !req.headers.authorization && !req.user) {
    res.set('Cache-Control', `public, max-age=${seconds}, stale-while-revalidate=${seconds * 5}`);
  } else {
    res.set('Cache-Control', 'no-store');
  }
  next();
};
