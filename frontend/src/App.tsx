import AuthProvider from "@/pages/provider/AuthProvider"
import ThemeProvider from "@/pages/provider/ThemeProvider"
import AppRouter from "@/route/AppRouter"

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ThemeProvider>
  )
}
