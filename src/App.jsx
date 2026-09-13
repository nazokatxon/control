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
  const { user, userRole } = useAuthContext(); // userRole shu yerda olindi

  return (
    <div className="min-h-screen bg-slate-100">
      {user && <Navbar />}
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
            
            {/* Hokim kelsa HokimEmployees (reyting), qolganlarga ManageUsers ochiladi */}
            <Route 
              path="/users/manage" 
              element={userRole === 'hokim' ? <HokimEmployees /> : <ManageUsers />} 
            />
          </Route>

          {/* Maxsus rollar uchun (Hokim, Yordamchi, Admin) */}
          <Route element={<ProtectedRoute allowedRoles={['hokim', 'yordamchi', 'admin']} />}>
            <Route path="/assistant" element={<AssistantDashboard />} />
            <Route path="/employees" element={<EmployeeControl />} />
            <Route path="/add-employee" element={<AddEmployee />} />
            <Route path="/tasks/create" element={<CreateTask />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/xodimlar" element={<Xodimlar />} />
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