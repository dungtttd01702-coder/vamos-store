/**
 * VAMOS STORE - Internationalization (i18n) Middleware
 * SSR Dictionary Engine for Vietnamese (default) & English
 */

const fs = require('fs');
const path = require('path');

const SUPPORTED_LOCALES = ['vi', 'en'];
const DEFAULT_LOCALE = 'vi';

// Load and cache translation dictionaries
const dictionaries = {};

function loadDictionary(locale) {
  if (dictionaries[locale]) return dictionaries[locale];
  try {
    const filePath = path.join(__dirname, `../locales/${locale}.json`);
    if (fs.existsSync(filePath)) {
      dictionaries[locale] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } else {
      dictionaries[locale] = {};
    }
  } catch (err) {
    console.warn(`[i18n] Failed to load locale dictionary for ${locale}:`, err.message);
    dictionaries[locale] = {};
  }
  return dictionaries[locale];
}

// Pre-load on startup
SUPPORTED_LOCALES.forEach(loadDictionary);

/**
 * Lightweight cookie header parser to avoid extra dependencies
 */
function parseCookieHeader(header) {
  const result = {};
  if (!header) return result;
  const parts = header.split(';');
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx !== -1) {
      const key = part.substring(0, idx).trim();
      const val = part.substring(idx + 1).trim();
      if (key) {
        try {
          result[key] = decodeURIComponent(val);
        } catch {
          result[key] = val;
        }
      }
    }
  }
  return result;
}

/**
 * Helper to resolve nested keys like "nav.home" or "admin.dashboard"
 */
function resolveNestedKey(obj, keyPath) {
  if (!obj || typeof obj !== 'object') return null;
  const parts = keyPath.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }
  return typeof current === 'string' ? current : null;
}

function i18nMiddleware(req, res, next) {
  // 1. Resolve active locale from cookies or query string
  const cookies = req.cookies || parseCookieHeader(req.headers.cookie);
  let locale = req.query?.lang || cookies?.vamos_locale;
  if (!locale || !SUPPORTED_LOCALES.includes(locale)) {
    locale = DEFAULT_LOCALE;
  }

  res.locals.currentLocale = locale;
  res.locals.supportedLocales = SUPPORTED_LOCALES;

  const currentDict = loadDictionary(locale);
  const defaultDict = loadDictionary(DEFAULT_LOCALE);

  // 2. Translation helper function attached to res.locals for Pug templates
  res.locals.t = function(key, fallback = '') {
    if (!key || typeof key !== 'string') return fallback || '';

    // Try current locale dictionary
    const val = resolveNestedKey(currentDict, key);
    if (val !== null) return val;

    // Fallback to default locale (vi) dictionary
    if (locale !== DEFAULT_LOCALE) {
      const defaultVal = resolveNestedKey(defaultDict, key);
      if (defaultVal !== null) return defaultVal;
    }

    // Return custom fallback or key itself
    return fallback || key;
  };

  next();
}

module.exports = {
  i18nMiddleware,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
};
