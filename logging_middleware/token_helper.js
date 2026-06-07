import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CREDENTIALS = {
  clientID: "02fd55f2-8dbd-4230-8b83-656183b3bd94",
  clientSecret: "QsESQPjvQfddTNNN",
  email: "vetta@gitam.in",
  name: "etta vindya",
  rollNo: "2023002231",
  accessCode: "wgKtgZ"
};

export async function getValidToken() {
  try {
    // Read the current token from config.js
    const configPath = path.join(__dirname, "config.js");
    let currentToken = "";
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, "utf8");
      const match = content.match(/ACCESS_TOKEN\s*=\s*"([^"]+)"/);
      if (match) {
        currentToken = match[1];
      }
    }

    // Verify if currentToken is valid and not expired
    if (currentToken) {
      try {
        const parts = currentToken.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
          const exp = payload.MapClaims?.exp || payload.exp;
          // Refresh 1 minute before actual expiry to be safe
          if (exp && (exp * 1000) > (Date.now() + 60000)) {
            return currentToken;
          }
        }
      } catch (e) {
        // Parse error, treat as expired
      }
    }

    // Token is missing, expired, or invalid. Request a new one.
    console.log("Token expired or missing. Fetching a fresh token from auth service...");
    const response = await axios.post("http://4.224.186.213/evaluation-service/auth", CREDENTIALS);
    const newToken = response.data.access_token;

    if (newToken) {
      // Save it back to config.js
      fs.writeFileSync(configPath, `export const ACCESS_TOKEN = "${newToken}";\n`);
      console.log("Successfully refreshed and saved the new access token to config.js");
      return newToken;
    }
  } catch (error) {
    console.error("Failed to refresh token:", error.message);
  }
  return null;
}
