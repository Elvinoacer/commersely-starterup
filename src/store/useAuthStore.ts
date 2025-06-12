// // src/store/useAuthStore
// import { Wishlist } from "@/types";
// import { API_ROUTES } from "@/utils/api";
// import axios from "axios";
// import { create } from "zustand";
// import { persist } from "zustand/middleware";

// type User = {
//   id: string;
//   name: string | null;
//   email: string;
//   role: "USER" | "SUPER_ADMIN";
//   wishlist: Wishlist;
// };

// type AuthStore = {
//   user: User | null;
//   isLoading: boolean;
//   error: string | null;
//   register: (
//     name: string,
//     email: string,
//     password: string
//   ) => Promise<{
//     message?: string;
//     success?: boolean;
//     userId?: string;
//     error?: string;
//   }>;
//   login: (email: string, password: string) => Promise<boolean>;
//   logout: () => Promise<void>;
//   refreshAccessToken: () => Promise<Boolean>;
// };
// const axiosInstance = axios.create({
//   baseURL: API_ROUTES.AUTH,
//   withCredentials: true,
//   headers: {
//     "Content-Type": "application/json",
//     Accept: "application/json",
//   },
// });

// export const useAuthStore = create<AuthStore>()(
//   persist(
//     (set, get) => ({
//       user: null,
//       isLoading: false,
//       error: null,
//       register: async (name, email, password) => {
//         set({ isLoading: true, error: null });
//         try {
//           const response = await axiosInstance.post("/register", {
//             name,
//             email,
//             password,
//           });

//           set({ isLoading: false });
//           return response.data;
//         } catch (error) {
//           console.log("Error: " + error);
//           set({
//             isLoading: false,
//             error: axios.isAxiosError(error)
//               ? error?.response?.data?.error || "Registration failed"
//               : "Registration failed",
//           });

//           return (
//             // @ts-ignore
//             error?.response?.data || {
//               error: "Registration failed",
//             }
//           );
//         }
//       },
//       login: async (email, password) => {
//         set({ isLoading: true, error: null });
//         try {
//           const response = await axiosInstance.post("/login", {
//             email,
//             password,
//           });
//           set({ isLoading: false, user: response.data.user });
//           return true;
//         } catch (error) {
//           set({
//             isLoading: false,
//             error: axios.isAxiosError(error) ? error?.response?.data?.error || "Login failed" : "Login failed",
//           });

//           return false;
//         }
//       },
//       logout: async () => {
//         set({ isLoading: true, error: null });
//         try {
//           await axiosInstance.post("/logout");
//           set({ user: null, isLoading: false });
//         } catch (error) {
//           set({
//             isLoading: false,
//             error: axios.isAxiosError(error) ? error?.response?.data?.error || "Logout failed" : "Logout failed",
//           });
//         }
//       },
//       refreshAccessToken: async () => {
//         try {
//           await axiosInstance.post("/refresh-token");
//           return true;
//         } catch (e) {
//           console.error(e);
//           return false;
//         }
//       },
//     }),
//     {
//       name: "auth-storage",
//       partialize: (state) => ({ user: state.user }),
//     }
//   )
// );

//local storage

import { Wishlist } from "@/types";
import { API_ROUTES } from "@/utils/api";
import axios from "axios";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "SUPER_ADMIN";
  wishlist: Wishlist;
};

type AuthStore = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{
    message?: string;
    success?: boolean;
    userId?: string;
    error?: string;
  }>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  setAccessToken: (accessToken: string) => void; // Add this action
};

// Axios instance with Authorization header
const axiosInstance = axios.create({
  baseURL: API_ROUTES.AUTH,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Add interceptor to include accessToken from localStorage
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,
      register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axiosInstance.post("/register", {
            name,
            email,
            password,
          });
          set({ isLoading: false });
          return response.data;
        } catch (error) {
          console.log("Error: " + error);
          set({
            isLoading: false,
            error: axios.isAxiosError(error)
              ? error?.response?.data?.error || "Registration failed"
              : "Registration failed",
          });
          return (
            // @ts-ignore
            error?.response?.data || {
              error: "Registration failed",
            }
          );
        }
      },
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axiosInstance.post("/login", {
            email,
            password,
          });
          const { accessToken, refreshToken, user } = response.data;
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", refreshToken);
          set({ isLoading: false, user, accessToken, refreshToken });
          return true;
        } catch (error) {
          set({
            isLoading: false,
            error: axios.isAxiosError(error) ? error?.response?.data?.error || "Login failed" : "Login failed",
          });
          return false;
        }
      },
      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          const refreshToken = localStorage.getItem("refreshToken");
          if (refreshToken) {
            await axiosInstance.post(
              "/logout",
              {},
              {
                headers: { Authorization: `Bearer ${refreshToken}` },
              }
            );
          }
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          set({ user: null, accessToken: null, refreshToken: null, isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error: axios.isAxiosError(error) ? error?.response?.data?.error || "Logout failed" : "Logout failed",
          });
        }
      },
      refreshAccessToken: async () => {
        try {
          const refreshToken = localStorage.getItem("refreshToken");
          if (!refreshToken) return false;
          const response = await axiosInstance.post(
            "/refresh-token",
            {},
            {
              headers: { Authorization: `Bearer ${refreshToken}` },
            }
          );
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", newRefreshToken);
          set({ accessToken, refreshToken: newRefreshToken });
          return true;
        } catch (e) {
          console.error(e);
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          set({ accessToken: null, refreshToken: null, user: null });
          return false;
        }
      },
      setAccessToken: (accessToken: string) => {
        localStorage.setItem("accessToken", accessToken);
        set({ accessToken });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken, refreshToken: state.refreshToken }),
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => localStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
