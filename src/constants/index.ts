// Map constants
export const DEFAULT_MAP_LONGITUDE = -3.5;
export const DEFAULT_MAP_LATITUDE = 54.5;
export const DEFAULT_MAP_ZOOM = 5;
export const RESULT_MAP_ZOOM = 13;
export const MAP_STYLE = 'mapbox://styles/mapbox/light-v11';

// API constants
export const GEOCODING_BASE_URL = 'https://api.postcodes.io/postcodes';
export const HTTP_STATUS_BAD_REQUEST = 400;
export const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;
export const HTTP_STATUS_METHOD_NOT_ALLOWED = 405;
export const HTTP_STATUS_NOT_FOUND = 404;

// Timing constants
export const DEBOUNCE_DELAY_MS = 300;
export const REQUEST_TIMEOUT_MS = 10000;
export const TRANSITION_DURATION_FAST = '0.2s';

// Validation constants
export const MAX_OVERALL_SCORE = 10;
export const MIN_OVERALL_SCORE = 1;
export const KEY_FACTORS_COUNT = 3;
export const MIN_REQUIRED_TEXT_LENGTH = 1;

// Claude constants
export const CLAUDE_TEMPERATURE_DETERMINISTIC = 0;
export const FIRST_CLAUDE_MESSAGE_CONTENT_INDEX = 0;

// Storage constants
export const RECENT_SEARCHES_STORAGE_KEY = 'dataground-recent-searches';
export const MAX_RECENT_SEARCHES = 3;
