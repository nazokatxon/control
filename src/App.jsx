import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './context/AuthContext';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import CreateTask from './pages/CreateTask';
import ManageUsers from './pages/ManageUsers';
import TaskDetails from './pages/TaskDetails';
import Chat from './pages/Chat'; 
import Register from './pages/Register';
import Profile from './pages/Profile';
import Xodimlar from './pages/Xodimlar'; 
import HokimEmployees from "./pages/HokimEmployees";
import Uchrashuvlar from './pages/Uchrashuvlar';
import EmployeeControl from './pages/EmployeeControl';
import AssistantDashboard from './pages/AssistantDashboard';
import AddEmployee from './pages/AddEmployee';
import Navbar from './components/layout/Navbar';

// 1. Himoyalangan Marshrut
function ProtectedRoute({ allowedRoles }) {
  const { user, userRole, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-900 text-white">
        <p className="text-lg font-medium animate-pulse">Yuklanmoqda...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

// 2. Ochiq Marshrut
function PublicRoute() {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-900 text-white">
        <p className="text-lg font-medium animate-pulse">Yuklanmoqda...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

// 3. Asosiy App Layout
function MainLayout() {
  const { user, userRole } = useAuthContext(); // userRole shu yerga qo'shildi
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  // Sahifa har yangilanganda (Foydalanuvchi tizimga kirgan bo'lsa) modal oynani chiqarish
  useEffect(() => {
    if (user) {
      setShowPermissionModal(true);
    }
  }, [user]);

  // Ruxsat olish tugmasi bosilganda ishlaydigan funksiya
  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: true 
      });
      stream.getTracks().forEach(track => track.stop());
      setShowPermissionModal(false); // Ruxsat berilsa oynani yopamiz
    } catch (err) {
      alert("Iltimos, kamera va mikrofon uchun ruxsat bering!");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 relative">
      {user && <Navbar />}
      
      {/* Har safar sahifa yangilanganda chiqadigan ruxsat so'rovchi oyna (Modal) */}
      {showPermissionModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl animate-scaleIn">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              🎙️📷
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Ruxsat talab etiladi</h3>
            <p className="text-sm text-gray-600 mb-6">
              Ilova to'g'ri ishlashi uchun kamera va mikrofondan foydalanishga ruxsat berishingiz kerak.
            </p>
            <button
              onClick={requestPermissions}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition shadow-lg shadow-blue-500/30"
            >
              Ruxsat berish
            </button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        <Routes>
          {/* Ochiq yo'llar */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Barcha avtorizatsiyadan o'tganlar uchun */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/tasks/:id" element={<TaskDetails />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/meetings" element={<Uchrashuvlar />} />
            <Route path="/profile" element={<Profile />} />
            <Route 
              path="/users/manage" 
              element={userRole === 'hokim' ? <HokimEmployees /> : <ManageUsers />} 
            />
          </Route>

          {/* Maxsus rollar uchun */}
          <Route element={<ProtectedRoute allowedRoles={['hokim', 'yordamchi', 'admin']} />}>
            <Route path="/assistant" element={<AssistantDashboard />} />
            <Route path="/employees" element={<EmployeeControl />} />
            <Route path="/add-employee" element={<AddEmployee />} />
            <Route path="/tasks/create" element={<CreateTask />} />
            <Route path="/xodimlar" element={<Xodimlar />} />
          </Route>

          <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </div>
    </div>
  );
}

// 4. Asosiy App Komponenti
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <MainLayout />
      </Router>
    </AuthProvider>
  );
}