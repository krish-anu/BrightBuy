import axiosInstance from "../axiosConfig";

// Local Storage Token Key
export const LOCAL_STORAGE__TOKEN = "brightbuy_token";

// Login function
export const loginUser = async (email: string, password: string, adminLogin = false) => {
  try {
    // console.log("Logging in user:", email);
    const response = await axiosInstance.post("/api/auth/login", {
      email,
      password,
      adminLogin,
    });
    // console.log("Res",response);

    if (response.status === 200) {
      const user = response.data;

      // Optionally store token in localStorage
      if (response.data.token) {
        localStorage.setItem(LOCAL_STORAGE__TOKEN, response.data.token);
      }

      return { success: true, user };
    } else {
      return {
        success: false,
        error: response.data.error || "Invalid credentials",
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || "Login failed",
    };
  }
};

// Decode JWT payload (no verification) to retrieve current user info
export const getCurrentUserFromToken = () => {
  try {
    const token = localStorage.getItem(LOCAL_STORAGE__TOKEN);
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload; // contains id, role, iat, exp
  } catch (err) {
    return null;
  }
};
