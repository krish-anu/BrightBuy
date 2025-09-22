import axiosInstance from "../axiosConfig";


// Local Storage Token Key
export const LOCAL_STORAGE__TOKEN = "brightbuy_token";

// Login function
export const loginUser = async (email: string, password: string) => {
  try {
    // console.log("Logging in user:", email);
    const response = await axiosInstance.post("/api/auth/login", {
      email,
      password,
    });
// console.log("Res",response);

    if (response.status===200) {
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
