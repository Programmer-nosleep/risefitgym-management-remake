import AuthProvider from "@/pages/provider/AuthProvider"
import AppRouter from "@/route/AppRouter"

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}
