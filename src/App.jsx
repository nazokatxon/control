import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './context/AuthContext';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import CreateTask from './pages/CreateTask';
import ManageUsers from './pages/ManageUsers';
import TaskDetails from './pages/TaskDetails';
import Chat from './pages/Chat'; 
import EmployeeControl from './pages/EmployeeControl';
import AssistantDashboard from './pages/AssistantDashboard';
import AddEmployee from './pages/AddEmployee';
import Navbar from './components/layout/Navbar';

// 1. Himoyalangan Marshrut (Faqat tizimga kirganlar va roli mos keladiganlar uchun)
function ProtectedRoute({ allowedRoles }) {
  const { user, userRole, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-900 text-white">
        <p className="text-lg font-medium animate-pulse">Yuklanmoqda...</p>
      </div>
    );
  }

  // Tizimga kirilmagan bo'lsa, login sahifasiga yo'naltiradi
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Rol mos kelmasa, umumiy dashboard'ga qaytaradi
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

// 2. Ochiq Marshrut (Tizimga kirgan foydalanuvchini qayta login sahifasiga o'tkazmaydi)
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
  const { user } = useAuthContext();

  return (
    <div className="min-h-screen bg-slate-100">
      {user && <Navbar />}
      <div className="container mx-auto px-4 py-6">
        <Routes>
          {/* Ochiq yo'llar (Faqat tizimga kirmaganlar uchun) */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Barcha avtorizatsiyadan o'tgan xodimlar uchun */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/tasks/:id" element={<TaskDetails />} />
            <Route path="/chat" element={<Chat />} />
          </Route>

          {/* Maxsus rollar uchun (Hokim, Yordamchi, Admin) */}
          <Route element={<ProtectedRoute allowedRoles={['hokim', 'yordamchi', 'admin']} />}>
            <Route path="/assistant" element={<AssistantDashboard />} />
            <Route path="/employees" element={<EmployeeControl />} />
            <Route path="/add-employee" element={<AddEmployee />} />
            <Route path="/tasks/create" element={<CreateTask />} />
          </Route>
          {/* Yordamchi va Hokim xodimlarni boshqara oladi */}
<Route element={<ProtectedRoute allowedRoles={['yordamchi', 'hokim', 'admin']} />}>
  <Route path="/users/manage" element={<ManageUsers />} />
</Route>

          {/* Noma'lum linklar kiritilganda */}
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