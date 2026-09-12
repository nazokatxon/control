import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { 
  Building2, 
  LogOut, 
  Users, 
  CheckSquare, 
  LayoutDashboard, 
  MessageSquare, 
  UserPlus, 
  PlusCircle, 
  User,
  Calendar
} from 'lucide-react';

export default function Navbar() {
  const { user, userRole, logout } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Chiqishda xatolik:', error);
    }
  };

  const isActive = (path) => location.pathname === path;

  const isHokimOrAdmin = userRole === 'hokim' || userRole === 'admin';
  const isYordamchi = userRole === 'yordamchi';
  const isManager = isHokimOrAdmin || isYordamchi;
  
  // Hokim, Yordamchi va Adminlar uchun xodimlarni boshqarish/ko'rish huquqi
  const canManageUsers = isManager; 

  return (
    <>
      <nav className="sticky top-0 z-50 bg-slate-900 text-white shadow-lg border-b border-slate-800">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* LOGO */}
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-base md:text-lg text-blue-400 hover:opacity-90 transition">
            <Building2 className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
            <span>HOKIM CONTROL</span>
          </Link>

          {/* DESKTOP NAVIGATSIYA */}
          <div className="hidden md:flex items-center gap-5">
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

            {isManager && (
              <Link 
                to="/meetings" 
                className={`flex items-center gap-1.5 text-sm font-medium transition ${
                  isActive('/meetings') ? 'text-blue-400 font-semibold' : 'text-slate-300 hover:text-blue-400'
                }`}
              >
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>Uchrashuvlar</span>
              </Link>
            )}

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

            {canManageUsers && (
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

          {/* MOBIL VERSIYADA YUQORIDA: UCHRASHUV VA CHIQISH */}
          <div className="md:hidden flex items-center gap-2">
            {isManager && (
              <Link
                to="/meetings"
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition border ${
                  isActive('/meetings') 
                    ? 'bg-blue-600 text-white border-blue-500' 
                    : 'bg-slate-800 text-blue-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Uchrashuv</span>
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium transition shadow-sm"
              title="Tizimdan chiqish"
            >
              <LogOut className="w-4 h-4" />
              <span>Chiqish</span>
            </button>
          </div>
        </div>
      </nav>

      {/* MOBIL UCHUN PASTKI IKONKALI MENYU (BOTTOM NAVIGATION BAR) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 px-1 py-2 flex items-center justify-around shadow-2xl pb-safe">
        <Link 
          to="/dashboard" 
          className={`flex flex-col items-center gap-0.5 transition ${
            isActive('/dashboard') ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-medium">Asosiy</span>
        </Link>

        <Link 
          to="/tasks" 
          className={`flex flex-col items-center gap-0.5 transition ${
            isActive('/tasks') ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckSquare className="w-5 h-5" />
          <span className="text-[10px] font-medium">Vazifalar</span>
        </Link>

        <Link 
          to="/chat" 
          className={`flex flex-col items-center gap-0.5 transition ${
            isActive('/chat') ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] font-medium">Chat</span>
        </Link>

        {canManageUsers && (
          <Link 
            to="/users/manage" 
            className={`flex flex-col items-center gap-0.5 transition ${
              isActive('/users/manage') ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-5 h-5 text-indigo-400" />
            <span className="text-[10px] font-medium">Xodimlar</span>
          </Link>
        )}

        <Link 
          to="/profile" 
          className={`flex flex-col items-center gap-0.5 transition ${
            isActive('/profile') ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium">Profil</span>
        </Link>
      </div>
    </>
  );
}