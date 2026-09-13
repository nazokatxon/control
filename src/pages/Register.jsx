import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { UserPlus, CheckCircle, AlertCircle, ArrowLeft, User, Building, MapPin, Phone, Lock } from 'lucide-react';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [mahalla, setMahalla] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const cleanUsername = username.trim().toLowerCase();
    const fullEmail = cleanUsername.includes('@') ? cleanUsername : `${cleanUsername}@tuman.uz`;

    try {
      // 1. Firebase Auth orqali foydalanuvchi yaratish
      const userCredential = await createUserWithEmailAndPassword(auth, fullEmail, password);
      const user = userCredential.user;

      // 2. Firestore bazasiga xodim ma'lumotlarini yozish
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        fullName: fullName.trim(),
        workplace: workplace.trim(),
        mahalla: mahalla.trim(),
        phone: phone.trim(),
        email: fullEmail,
        role: 'xodim',
        status: 'active',
        createdAt: new Date().toISOString()
      });

      setSuccess("Muvaffaqiyatli ro'yxatdan o'tdingiz! Tizimga kirish sahifasiga o'tilmoqda...");
      
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);

    } catch (err) {
      console.error("Xatolik:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError("Bu login allaqachon band qilingan!");
      } else if (err.code === 'auth/weak-password') {
        setError("Parol juda oddiy (kamida 6 ta belgi bo'lishi kerak)!");
      } else if (err.code === 'auth/invalid-email') {
        setError("Login (email) formati noto'g'ri!");
      } else {
        setError("Xatolik yuz berdi: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
        
        <div className="mb-4">
          <Link to="/login" className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 transition">
            <ArrowLeft className="w-4 h-4" /> Tizimga kirishga qaytish
          </Link>
        </div>

        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <UserPlus className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Xodim sifatida ro'yxatdan o'tish</h1>
          <p className="text-xs text-slate-500 mt-1">Barcha maydonlarni to'ldiring</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Ism va Familiya</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Masalan: Ali Valiyev"
                className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Bo'lim / Ish joyi</label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={workplace}
                onChange={(e) => setWorkplace(e.target.value)}
                placeholder="Masalan: Qurilish bo'limi"
                className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mahalla / Hudud</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={mahalla}
                onChange={(e) => setMahalla(e.target.value)}
                placeholder="Masalan: Navro'z MFY"
                className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Telefon Raqami</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Login</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masalan: alivaliyev"
                className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Parol</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kamida 6 ta belgi"
                className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition text-sm shadow-lg shadow-blue-200 disabled:opacity-50 mt-2"
          >
            {loading ? "Ro'yxatdan o'tilmoqda..." : "Ro'yxatdan o'tish"}
          </button>
        </form>

      </div>
    </div>
  );
}