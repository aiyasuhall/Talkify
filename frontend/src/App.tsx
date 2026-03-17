import {BrowserRouter, Route, Routes} from "react-router"
import SignInPage from "./pages/SignInPage"
import SignUpPage from "./pages/SignUpPage"
import ChatAppPage from "./pages/ChatAppPage"
import {Toaster} from "sonner" // hiển thị ở các trang
import ProtectedRoute from "./components/auth/ProtectedRoute"
import { useThemeStore } from "./stores/useThemeStore"
import { useEffect } from "react"
import { useAuthStore } from "./stores/useAuthStore"
import { useSocketStore } from "./stores/useSocketStore"

function App() {
  const { isDark, setTheme } = useThemeStore();
  const { accessToken } = useAuthStore();
  const { connectSocket, disconnectSocket } = useSocketStore();

  useEffect(() => {
    setTheme(isDark);
  }, [isDark]); // app load, theme sẽ được lưu theo state lưu trước đó

  useEffect(() => {
    if (accessToken) {
      connectSocket();
    }

    return () => disconnectSocket();
  }, [accessToken]);

  return (
    <>
      <Toaster richColors /> 
      <BrowserRouter>
        <Routes>
          {/* public routes */}
          <Route
            path="/signin"
            element={<SignInPage/>} 
          />

          <Route
            path="/signup"
            element={<SignUpPage/>} 
          />

          {/* protected routes */} 
          <Route element={<ProtectedRoute/>}> 
            <Route
              path="/"
              element={<ChatAppPage/>} 
            /> 
          
          </Route>  
          

      </Routes>
      </BrowserRouter>
      </>
  )
}

export default App
