import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  token: localStorage.getItem('userToken') || sessionStorage.getItem('userToken'),
  isAuthenticated: false,
  loading: false,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token, rememberMe } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      
      // Beni hatırla seçeneğine göre token'ı kaydet
      if (rememberMe) {
        localStorage.setItem('userToken', token);
      } else {
        sessionStorage.setItem('userToken', token);
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('userToken');
      sessionStorage.removeItem('userToken');
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    }
  }
});

export const { setCredentials, logout, setLoading, setError } = authSlice.actions;
export default authSlice.reducer; 