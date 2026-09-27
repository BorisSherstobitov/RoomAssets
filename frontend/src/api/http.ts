import axios from "axios";
import { API_URL } from "@/config/env";

export const http = axios.create({
  baseURL: API_URL,
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.response.use(
  (r) => r,
  (err) => {
    console.error("HTTP error:", err);
    throw err;
  }
);
