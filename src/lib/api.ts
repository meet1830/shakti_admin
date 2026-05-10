import axios from "axios";

// export const API_URL = "https://shakti-server.onrender.com";
export const API_URL = "http://localhost:3001";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    "source": "admin",
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const userStr = localStorage.getItem("user");
        let userId = "";
        
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            userId = user._id;
          } catch (e) {
            console.error("Failed to parse user from localStorage", e);
          }
        }

        if (refreshToken && userId) {
          const res = await axios.post(`${API_URL}/user/refresh`, {
            userId,
            refreshToken,
          });

          const newAccessToken = res.data.accessToken;
          const newRefreshToken = res.data.refreshToken;

          localStorage.setItem("accessToken", newAccessToken);
          localStorage.setItem("refreshToken", newRefreshToken);

          api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (err) {
        // Refresh token failed, clear storage and let context handle redirect
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
