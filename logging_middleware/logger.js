import axios from "axios";
import { getValidToken } from "./token_helper.js";

export async function Log(stack, level, packageName, message) {
  try {
    const token = await getValidToken();
    if (!token) {
      console.error("Could not obtain a valid token for logging.");
      return;
    }

    const response = await axios.post(
      "http://4.224.186.213/evaluation-service/logs",
      {
        stack: stack,
        level: level,
        package: packageName,
        message: message
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log("Log sent successfully:", response.data);

  } catch (error) {
    console.error("Logger error:", error.response?.data || error.message);
  }
}