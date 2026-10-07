/**
 * Unified API Client for Relief Shield
 * 
 * Provides:
 * 1. Automatic inclusion of 'bypass-tunnel-reminder: true' to prevent LocalTunnel
 *    from intercepting API calls with its 511 reminder splash screen.
 * 2. Robust handling of plain text responses (e.g. "no tunnel" when LocalTunnel
 *    disconnects, or 502/504 gateway messages) to prevent cryptic SyntaxError crashes
 *    ("Unexpected token 'o', 'no tunnel' is not valid JSON").
 * 3. Graceful JSON parsing and helpful error messaging.
 */

export const apiFetch = async (endpoint, options = {}) => {
  const API_BASE = import.meta.env.VITE_API_URL || '/api';
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = {
    'bypass-tunnel-reminder': 'true',
    ...(options.headers || {}),
  };

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkErr) {
    throw new Error(
      `Network error: Could not reach the server (${networkErr.message}). ` +
      `If using a tunnel, verify the tunnel process is running. Otherwise, use http://localhost:5173.`
    );
  }

  const contentType = response.headers.get('content-type') || '';
  let data = null;

  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      const rawText = await response.text().catch(() => '');
      throw new Error(`Invalid JSON received: ${rawText.slice(0, 100)}`);
    }
  } else {
    // Non-JSON response (e.g. plain text "no tunnel", HTML 511/502/404)
    const rawText = await response.text().catch(() => '');
    const trimmed = rawText.trim();

    if (trimmed.toLowerCase().includes('no tunnel')) {
      throw new Error(
        'Tunnel disconnected: The LocalTunnel server returned "no tunnel". ' +
        'LocalTunnel has disconnected or the tunnel URL expired. ' +
        'Please restart LocalTunnel or use http://localhost:5173 directly.'
      );
    }

    if (trimmed.includes('Tunnel website ahead') || trimmed.includes('localtunnel')) {
      throw new Error(
        'LocalTunnel reminder page intercepted this request. ' +
        'Please open the tunnel URL in your browser and click "Continue", or use http://localhost:5173.'
      );
    }

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}: ${trimmed.slice(0, 120) || response.statusText}`);
    }

    try {
      data = JSON.parse(rawText);
    } catch {
      data = { message: trimmed };
    }
  }

  if (!response.ok) {
    const errorMsg =
      (data && (data.message || data.error)) ||
      `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
};
