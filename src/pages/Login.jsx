import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { LogIn, Lock, User, AlertCircle } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Kiritilgan loginda @ bo'lmasa, avtomatik @tuman.uz qo'shiladi
    const cleanInput = username.trim();
    const fullEmail = cleanInput.includes('@') ? cleanInput : `${cleanInput}@tuman.uz`;

    try {
      // 1. Firebase Auth SDK orqali tizimga kirish
      const userCredential = await signInWithEmailAndPassword(auth, fullEmail, password);
      const user = userCredential.user;

      // 2. Firestore 'users' kolleksiyasidan foydalanuvchi hujjatini tekshirish
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (userDoc.exists()) {
        // Muvaffaqiyatli kirildi - Dashboard sahifasiga yo'naltirish
        navigate('/dashboard', { replace: true });
      } else {
        setError("Foydalanuvchi ma'lumotlari Firestore'dan topilmadi!");
      }
    } catch (err) {
      console.error("Login xatosi:", err);
      
      // Xatolik turlarini aniq ko'rsatish
      if (
        err.code === 'auth/user-not-found' || 
        err.code === 'auth/wrong-password' || 
        err.code === 'auth/invalid-credential'
      ) {
        setError("Login yoki parol noto'g'ri!");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Noma'lum harakatlar ko'p bo'ldi. Birozdan so'ng qayta urinib ko'ring!");
      } else {
        setError("Tizimga kirishda xatolik yuz berdi!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Tizimga Kirish</h1>
          <p className="text-sm text-slate-500 mt-1">Hokimlik monitoring va topshiriqlar paneli</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Login</label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="masalan: hokim"
                className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Parol</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-blue-200 disabled:opacity-50"
          >
            {loading ? 'Kirilmoqda...' : 'Tizimga Kirish'}
          </button>
        </form>
      </div>
    </div>
  );
}