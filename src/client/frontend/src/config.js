const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export { API_URL };

export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

export const API_TIMEOUT = 10000;
export const WS_RECONNECT_INTERVAL = 3000;

// Ensure URLs are properly formatted
export const getWsUrl = (token) => {
    try {
        const url = new URL(WS_URL);
        // Ensure we're using the correct WebSocket protocol
        url.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        url.searchParams.append('token', token);
        return url.toString();
    } catch (e) {
        console.error('Invalid WebSocket URL:', e);
        return `${WS_URL}/?token=${token}`;
    }
};

export const config = {
    API_URL,
    WS_URL: getWsUrl(WS_URL),
    API_TIMEOUT,
    WS_RECONNECT_INTERVAL,
};

// Validate config
if (!config.API_URL) {
  throw new Error('API_URL is required in configuration');
}

if (!config.WS_URL) {
  throw new Error('WS_URL is required in configuration');
}

export default config;
