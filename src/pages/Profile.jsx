import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updatePassword, updateEmail, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useAuthContext } from '../context/AuthContext';
import { User, Lock, Moon, Sun, Save, ShieldCheck } from 'lucide-react';

export default function Profile() {
  const { user } = useAuthContext();
  const [userData, setUserData] = useState({ name: '', email: '', role: '', workplace: '', mahalla: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Tahrirlash state'lari
  const [name, setName] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [mahalla, setMahalla] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');

  // Parolni o'zgartirish state'lari
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passMessage, setPassMessage] = useState({ type: '', text: '' });
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          setName(data.name || data.fullName || '');
          setWorkplace(data.workplace || '');
          setMahalla(data.mahalla || '');
          setPhone(data.phone || '');
          setUsername(user.email ? user.email.split('@')[0] : '');
        }
      } catch (err) {
        console.error("Profil ma'lumotlarini olishda xatolik:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Profil ma'lumotlarini saqlash
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      // 1. Login (Email) o'zgargan bo'lsa tekshirib yangilash
      const cleanUsername = username.trim().toLowerCase();
      const newEmail = cleanUsername.includes('@') ? cleanUsername : `${cleanUsername}@tuman.uz`;
      if (newEmail !== user.email) {
        await updateEmail(user, newEmail);
      }

      // 2. Firestore bazasini yangilash
      const userRef = doc(db, 'users', user.uid);
      const updateData = {
        name: name.trim(),
        fullName: name.trim(),
        workplace: workplace.trim(),
        mahalla: mahalla.trim(),
        phone: phone.trim(),
        email: newEmail,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(userRef, updateData);
      setUserData(prev => ({ ...prev, ...updateData }));
      setMessage({ type: 'success', text: "Profil ma'lumotlari muvaffaqiyatli saqlandi!" });
    } catch (err) {
      console.error("Saqlash xatosi:", err);
      if (err.code === 'auth/requires-recent-login') {
        setMessage({ type: 'error', text: "Xavfsizlik uchun qaytadan tizimga kirib, so'ng o'zgartiring!" });
      } else {
        setMessage({ type: 'error', text: "Xatolik: " + err.message });
      }
    } finally {
      setSaving(false);
    }
  };

  // Parolni yangilash
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPassLoading(true);
    setPassMessage({ type: '', text: '' });

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      setPassMessage({ type: 'success', text: "Parol muvaffaqiyatli o'zgartirildi!" });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      console.error("Parolni o'zgartirish xatosi:", err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPassMessage({ type: 'error', text: "Joriy parol noto'g'ri kiritildi!" });
      } else {
        setPassMessage({ type: 'error', text: "Xatolik: " + err.message });
      }
    } finally {
      setPassLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-xs text-slate-400">Yuklanmoqda...</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 pb-24 md:pb-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
          <User className="w-6 h-6 text-blue-600" />
          <span>Profil Sozlamalari</span>
        </h2>
        <p className="text-xs text-slate-500">Shaxsiy ma'lumotlar va tizim sozlamalari</p>
      </div>

      {message.text && (
        <div className={`p-3 rounded-xl text-xs font-medium ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Asosiy tahrirlash formasi */}
      <form onSubmit={handleProfileUpdate} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-500" />
          <span>Shaxsiy ma'lumotlarni tahrirlash</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Ism va familiya</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Login (@tuman.uz)</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Bo'lim / Ish joyi</label>
            <input
              type="text"
              value={workplace}
              onChange={(e) => setWorkplace(e.target.value)}
              placeholder="Masalan: Qurilish bo'limi"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Telefon raqami</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+998 90 123 45 67"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <span className="text-slate-400 block mb-1">Tizimdagi roli</span>
            <span className="inline-block px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 font-bold rounded-lg uppercase tracking-wider">
              {userData.role || 'XODIM'}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saqlanmoqda..." : "O'zgarishlarni saqlash"}</span>
        </button>
      </form>

      {/* Tungi rejim (Dark Mode) sozlamasi */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-500">
            {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-white">Tungi rejim (Dark Mode)</h4>
            <p className="text-xs text-slate-500">Ekran rangini qora yoki oq qilish</p>
          </div>
        </div>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
            darkMode ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
          }`}
        >
          <div className="w-4 h-4 rounded-full bg-white shadow-md transform transition duration-300"></div>
        </button>
      </div>

      {/* Parolni o'zgartirish formasi */}
      <form onSubmit={handlePasswordChange} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-blue-500" />
          <span>Parolni o'zgartirish</span>
        </h3>

        {passMessage.text && (
          <p className={`text-xs p-2.5 rounded-xl font-medium ${
            passMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : 'bg-red-50 text-red-600 dark:bg-red-900/30'
          }`}>
            {passMessage.text}
          </p>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Joriy parol</label>
            <input
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Yangi parol (kamida 6 ta belgi)</label>
            <input
              type="password"
              placeholder="••••••••"
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={passLoading}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{passLoading ? "Yangilanmoqda..." : "Parolni yangilash"}</span>
        </button>
      </form>
    </div>
  );
}