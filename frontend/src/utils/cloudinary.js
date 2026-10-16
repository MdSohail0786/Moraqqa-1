/**
 * Cloudinary delivery helpers. Cards and thumbnails never receive the original file:
 * every URL gets an f_auto (WebP/AVIF), q_auto, width-limited transformation.
 */

const isCloudinary = (url) => typeof url === 'string' && url.includes('/res.cloudinary.com/') && url.includes('/upload/');

// Strip any transformation segment already present so we never stack transforms.
const splitUrl = (url) => {
  const [head, tail] = url.split('/upload/');
  const parts = tail.split('/');
  while (parts.length > 1 && /^([a-z]{1,3}_[^/,]+)(,[a-z]{1,3}_[^/,]+)*$/i.test(parts[0]) && !/^v\d+$/.test(parts[0])) {
    parts.shift();
  }
  return [head, parts.join('/')];
};

/**
 * @param {string} url Cloudinary secure URL
 * @param {{w?:number,h?:number,crop?:string,gravity?:string,q?:string,blur?:number}} opts
 */
export function cld(url, opts = {}) {
  if (!isCloudinary(url)) return url;
  const { w, h, crop = h ? 'fill' : 'limit', gravity = 'auto', q = 'auto', blur } = opts;
  const t = ['f_auto', `q_${q}`, 'dpr_auto'];
  if (w) t.push(`w_${w}`);
  if (h) t.push(`h_${h}`);
  t.push(`c_${crop}`);
  if (h && crop === 'fill') t.push(`g_${gravity}`);
  if (blur) t.push(`e_blur:${blur}`);
  const [head, rest] = splitUrl(url);
  return `${head}/upload/${t.join(',')}/${rest}`;
}

/** Tiny blurred placeholder (~1KB) shown until the real image has loaded. */
export const placeholder = (url) => cld(url, { w: 28, q: '30', blur: 800 });

export const DEFAULT_WIDTHS = [400, 640, 960, 1280, 1600];

export function srcSet(url, widths = DEFAULT_WIDTHS, extra = {}) {
  if (!isCloudinary(url)) return undefined;
  return widths.map((w) => `${cld(url, { w, ...extra })} ${w}w`).join(', ');
}

/** Width of the full-screen viewer image: sharp on the device, capped for sanity. */
export function viewerWidth() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  return Math.min(2400, Math.round(window.innerWidth * dpr));
}
