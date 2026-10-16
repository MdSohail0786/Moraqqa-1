import sanitizeHtml from 'sanitize-html';

const clean = (value) => {
  if (typeof value === 'string') {
    // Strip every tag; decode the entities sanitize-html encodes so plain text stays readable.
    return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      // Drop NoSQL operator injection ($where, $ne ...) and dotted paths.
      if (key.startsWith('$') || key.includes('.')) continue;
      out[key] = clean(val);
    }
    return out;
  }
  return value;
};

export const sanitizeInput = (req, _res, next) => {
  if (req.body) req.body = clean(req.body);
  if (req.query) {
    const q = clean(req.query);
    Object.keys(req.query).forEach((k) => delete req.query[k]);
    Object.assign(req.query, q);
  }
  if (req.params) req.params = clean(req.params);
  next();
};
