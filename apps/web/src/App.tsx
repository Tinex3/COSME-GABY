import { Routes, Route, Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import Layout from './components/Layout';
import { useAuth } from './lib/auth';
import Home from './pages/Home';
import Professionals from './pages/Professionals';
import ProfessionalProfile from './pages/ProfessionalProfile';
import Treatments from './pages/Treatments';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Forums from './pages/Forums';
import ForumTopicPage from './pages/ForumTopic';
import Ubicacion from './pages/Ubicacion';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientPanel from './pages/PatientPanel';
import SpecialistDashboard from './pages/SpecialistDashboard';
import AdminPanel from './pages/AdminPanel';

function Protected({ role, children }: { role?: string; children: ReactNode }) {
  const { user, isRole } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && !isRole(role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profesionales" element={<Professionals />} />
        <Route path="/profesional/:id" element={<ProfessionalProfile />} />
        <Route path="/tratamientos" element={<Treatments />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/foros" element={<Forums />} />
        <Route path="/foros/:id" element={<ForumTopicPage />} />
        <Route path="/ubicacion" element={<Ubicacion />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        <Route
          path="/panel/paciente"
          element={<Protected role="PACIENTE"><PatientPanel /></Protected>}
        />
        <Route
          path="/panel/especialista"
          element={<Protected role="ESPECIALISTA"><SpecialistDashboard /></Protected>}
        />
        <Route
          path="/admin"
          element={<Protected role="ADMIN"><AdminPanel /></Protected>}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
