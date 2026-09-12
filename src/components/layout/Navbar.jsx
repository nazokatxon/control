import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { 
  Building2, 
  LogOut, 
  Users, 
  CheckSquare, 
  LayoutDashboard, 
  Menu, 
  X, 
  MessageSquare, 
  UserPlus, 
  PlusCircle, 
  User 
} from 'lucide-react';

export default function Navbar() {
  const { user, userRole, logout } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Chiqishda xatolik:', error);
    }
  };

  // Aktiv linkni ajratib ko'rsatish uchun yordamchi funksiya
  const isActive = (path) => location.pathname === path;

  // Rollarga tegishli shartlar
  const isHokimOrAdmin = userRole === 'hokim' || userRole === 'admin';
  const isYordamchi = userRole === 'yordamchi';
  const isManager = isHokimOrAdmin || isYordamchi; // Hokim, Admin va Yordamchi

  return (
    <nav className="sticky top-0 z-50 bg-slate-900 text-white shadow-lg border-b border-slate-800">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* LOGO */}
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-base md:text-lg text-blue-400 hover:opacity-90 transition">
          <Building2 className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
          <span>HOKIM CONTROL</span>
        </Link>

        {/* DESKTOP NAVIGATSIYA */}
        <div className="hidden md:flex items-center gap-5">
          {/* Barcha foydalanuvchilar uchun */}
          <Link 
            to="/dashboard" 
            className={`flex items-center gap-1.5 text-sm font-medium transition ${
              isActive('/dashboard') ? 'text-blue-400 font-semibold' : 'text-slate-300 hover:text-blue-400'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          <Link 
            to="/tasks" 
            className={`flex items-center gap-1.5 text-sm font-medium transition ${
              isActive('/tasks') ? 'text-blue-400 font-semibold' : 'text-slate-300 hover:text-blue-400'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Topshiriqlar</span>
          </Link>

          <Link 
            to="/chat" 
            className={`flex items-center gap-1.5 text-sm font-medium transition ${
              isActive('/chat') ? 'text-emerald-400 font-semibold' : 'text-emerald-400/80 hover:text-emerald-300'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat</span>
          </Link>

          {/* Faqat Hokim, Yordamchi va Admin uchun: Topshiriq biriktirish */}
          {isManager && (
            <Link 
              to="/tasks/create" 
              className={`flex items-center gap-1.5 text-sm font-medium transition ${
                isActive('/tasks/create') ? 'text-blue-400 font-semibold' : 'text-slate-300 hover:text-blue-400'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-blue-400" />
              <span>Yangi topshiriq</span>
            </Link>
          )}

          {/* Faqat Hokim va Admin uchun: Xodimlar nazorati */}
          {isHokimOrAdmin && (
            <Link 
              to="/employees" 
              className={`flex items-center gap-1.5 text-sm font-medium transition ${
                isActive('/employees') ? 'text-amber-400 font-semibold' : 'text-amber-400/80 hover:text-amber-300'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Xodimlar nazorati</span>
            </Link>
          )}

          {/* Faqat Yordamchi va Admin uchun: Akkaunt ochish / Boshqaruv */}
          {(isYordamchi || userRole === 'admin') && (
            <Link 
              to="/users/manage" 
              className={`flex items-center gap-1.5 text-sm font-medium transition ${
                isActive('/users/manage') ? 'text-indigo-400 font-semibold' : 'text-slate-300 hover:text-indigo-400'
              }`}
            >
              <UserPlus className="w-4 h-4 text-indigo-400" />
              <span>Xodimlarni boshqarish</span>
            </Link>
          )}
        </div>

        {/* DESKTOP ROL, PROFIL VA CHIQISH */}
        <div className="hidden md:flex items-center gap-3">
          <Link 
            to="/profile" 
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Profil sozlamalari"
          >
            <User className="w-4 h-4" />
          </Link>

          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-800 border border-slate-700 uppercase tracking-wider text-slate-300">
            ROL: <strong className="text-blue-400">{userRole || 'XODIM'}</strong>
          </span>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Chiqish</span>
          </button>
        </div>

        {/* MOBIL TUGMA (HAMBURGER) */}
        <div className="md:hidden flex items-center gap-2">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white focus:outline-none"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* MOBIL MENYU */}
      {isOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-3">
          <Link 
            to="/dashboard" 
            onClick={() => setIsOpen(false)} 
            className="flex items-center gap-2 py-2 text-sm font-medium text-slate-200 hover:text-blue-400"
          >
            <LayoutDashboard className="w-4 h-4 text-blue-400" />
            <span>Dashboard</span>
          </Link>

          <Link 
            to="/tasks" 
            onClick={() => setIsOpen(false)} 
            className="flex items-center gap-2 py-2 text-sm font-medium text-slate-200 hover:text-blue-400"
          >
            <CheckSquare className="w-4 h-4 text-blue-400" />
            <span>Topshiriqlar</span>
          </Link>

          <Link 
            to="/chat" 
            onClick={() => setIsOpen(false)} 
            className="flex items-center gap-2 py-2 text-sm font-medium text-emerald-400 hover:text-emerald-300"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat (Ovozli va matn)</span>
          </Link>

          {/* Mobil: Yangi topshiriq */}
          {isManager && (
            <Link 
              to="/tasks/create" 
              onClick={() => setIsOpen(false)} 
              className="flex items-center gap-2 py-2 text-sm font-medium text-blue-300 hover:text-blue-200"
            >
              <PlusCircle className="w-4 h-4 text-blue-400" />
              <span>Yangi topshiriq biriktirish</span>
            </Link>
          )}

          {/* Mobil: Xodimlar nazorati */}
          {isHokimOrAdmin && (
            <Link 
              to="/employees" 
              onClick={() => setIsOpen(false)} 
              className="flex items-center gap-2 py-2 text-sm font-medium text-amber-400 hover:text-amber-300"
            >
              <Users className="w-4 h-4" />
              <span>Xodimlar nazorati</span>
            </Link>
          )}

          {/* Mobil: Xodimlarni boshqarish */}
          {(isYordamchi || userRole === 'admin') && (
            <Link 
              to="/users/manage" 
              onClick={() => setIsOpen(false)} 
              className="flex items-center gap-2 py-2 text-sm font-medium text-indigo-400 hover:text-indigo-300"
            >
              <UserPlus className="w-4 h-4" />
              <span>Xodimlarni boshqarish</span>
            </Link>
          )}

          {/* Mobil: Profil Linki */}
          <Link 
            to="/profile" 
            onClick={() => setIsOpen(false)} 
            className="flex items-center gap-2 py-2 text-sm font-medium text-slate-300 hover:text-white"
          >
            <User className="w-4 h-4 text-slate-400" />
            <span>Mening profilim</span>
          </Link>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase">
              ROL: <strong className="text-blue-400">{userRole || 'XODIM'}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-xs font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Chiqish</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}