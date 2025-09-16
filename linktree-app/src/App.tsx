import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
// import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';


function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/:username" element={<div>Página de Perfil Público</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;