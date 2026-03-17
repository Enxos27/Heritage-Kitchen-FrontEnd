import axios from "axios";
// Creo un'istanza di axios con la baseURL del backend per semplificare le chiamate API

const api = axios.create({
  baseURL: "http://localhost:8080", // L'indirizzo del backend Spring Boot
});

// Questo "interceptor" aggiunge il token a ogni chiamata automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
