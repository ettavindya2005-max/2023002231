import axios from "axios";

// Using relative paths to leverage Vite's dev server proxy, bypassing CORS misconfigurations on the remote host
const AUTH_URL = "/evaluation-service/auth";
const NOTIFICATIONS_URL = "/evaluation-service/notifications";

const CREDENTIALS = {
  clientID: "02fd55f2-8dbd-4230-8b83-656183b3bd94",
  clientSecret: "QsESQPjvQfddTNNN",
  email: "vetta@gitam.in",
  name: "etta vindya",
  rollNo: "2023002231",
  accessCode: "wgKtgZ"
};

let cachedToken = localStorage.getItem("auth_token") || null;
let tokenExpiry = localStorage.getItem("auth_token_expiry") || null;

// Safe JWT Decoder for Browser (handles base64url and padding)
function decodeJwt(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    let base64Url = parts[1];
    // Replace URL-safe characters
    let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    
    // Add necessary padding
    const pad = base64.length % 4;
    if (pad) {
      if (pad === 1) throw new Error("Invalid base64 string");
      base64 += new Array(5 - pad).join("=");
    }

    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("JWT Decode Error:", e.message);
    return null;
  }
}

// Decodes JWT payload to check expiry
function isTokenValid() {
  if (!cachedToken || !tokenExpiry) return false;
  // If expiry time is greater than current time + 1 minute, it's valid
  return Number(tokenExpiry) > Date.now() + 60000;
}

// Fetches a new token from the auth server
async function fetchNewToken() {
  try {
    const response = await axios.post(AUTH_URL, CREDENTIALS);
    const token = response.data.access_token;
    if (token) {
      cachedToken = token;
      
      const payload = decodeJwt(token);
      if (payload) {
        const exp = payload.MapClaims?.exp || payload.exp;
        if (exp) {
          tokenExpiry = exp * 1000;
          localStorage.setItem("auth_token", token);
          localStorage.setItem("auth_token_expiry", tokenExpiry.toString());
        }
      }
      return token;
    }
  } catch (error) {
    console.error("Auth Token Fetch Failure:", error.message);
    throw new Error("Authentication failed.");
  }
}

// Retrieves a valid auth token (auto-refreshes if expired)
export async function getAuthToken() {
  if (isTokenValid()) {
    return cachedToken;
  }
  return await fetchNewToken();
}

// Helper to execute request with automatic 401 retry
async function executeWithRetry(apiCallFunc) {
  try {
    return await apiCallFunc();
  } catch (error) {
    // If request fails with 401 Unauthorized, force token refresh and try again
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized request (401). Retrying with fresh token...");
      try {
        await fetchNewToken();
        return await apiCallFunc();
      } catch (retryError) {
        console.error("Retry failed:", retryError.message);
        throw retryError;
      }
    }
    throw error;
  }
}

// Fetch notifications with pagination and optional type filter
export async function fetchNotifications({ page = 1, limit = 10, type = "" }) {
  const getRequest = async () => {
    const token = await getAuthToken();
    const params = { page, limit };
    if (type) {
      params.notification_type = type;
    }

    const response = await axios.get(NOTIFICATIONS_URL, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params
    });

    return response.data;
  };

  return await executeWithRetry(getRequest);
}
