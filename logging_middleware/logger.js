import axios from "axios";
import { ACCESS_TOKEN } from "./config.js";

export async function Log(stack, level, packageName, message) {
  try {
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
          Authorization: `Bearer ${ACCESS_TOKEN}`
        }
      }
    );

    console.log(response.data);

  } catch (error) {
    console.error(error.message);
  }
}