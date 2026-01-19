import axios from 'axios'

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
})

api.interceptors.response.use(
  res => res,
  err => {
    console.error('API Error:', err.response?.data || err.message)
    return Promise.reject(err)
  }
)
