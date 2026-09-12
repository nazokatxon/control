import { useState } from 'react';
import { db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { UserPlus, CheckCircle, AlertCircle } from 'lucide-react';

export default function AddEmployee() {
  const [fullName, setFullName] = useState('');
  const [workplace, setWorkplace] = useState(''); // Qayerda va nima ish qilishi
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState(''); // email o'rniga username deb nomlandi
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('xodim');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Kiritilgan loginni tozalab, agar @ bo'lmasa avtomatik @tuman.uz biriktiramiz
    const cleanUsername = username.trim();
    const fullEmail = cleanUsername.includes('@') ? cleanUsername : `${cleanUsername}@tuman.uz`;

    try {
      // 1. Firebase Auth orqali akkaunt ochish
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: fullEmail,
            password,
            returnSecureToken: true
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Xatolik yuz berdi");
      }

      // 2. Firestore 'users' kolleksiyasiga to'liq ma'lumotlarni saqlash
      await setDoc(doc(db, 'users', data.localId), {
        fullName: fullName.trim(),
        workplace: workplace.trim(),
        phone: phone.trim(),
        email: fullEmail,
        role: role,
        createdAt: new Date()
      });

      setMessage({ type: 'success', text: `Xodim (${fullName}) muvaffaqiyatli saqlandi!` });
      
      // Formani tozalash
      setFullName('');
      setWorkplace('');
      setPhone('');
      setUsername('');
      setPassword('');
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: "Xatolik: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-2xl shadow-md border border-slate-200">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
          <UserPlus className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Yangi Xodim Qo'shish</h2>
          <p className="text-xs text-slate-500">Xodimlarning to'liq ma'lumotlarini kiritish</p>
        </div>
      </div>

      {message.text && (
        <div className={`mb-4 p-3 rounded-xl text-sm flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleAddEmployee} className="space-y-4">
        {/* Ism Familiya */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Ism va Familiya</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Masalan: Ali Valiyev"
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Qayerda va nima ish qilishi */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Ish joyi va Lavozimi</label>
          <input
            type="text"
            required
            value={workplace}
            onChange={(e) => setWorkplace(e.target.value)}
            placeholder="Masalan: Qurilish bo'limi bosh mutaxassisi"
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Telefon raqami */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Telefon Raqami</label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+998 90 123 45 67"
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Login */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Login (Foydalanuvchi nomi)</label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="aminboyeva18"
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Parol */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Vaqtincha Parol</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Kamida 6 ta belgi"
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Roli */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tizimdagi Roli</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
          >
            <option value="xodim">Xodim / Ijrochi</option>
            <option value="yordamchi">Hokim yordamchisi</option>
            <option value="orinbosar">O'rinbosar</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition shadow-md disabled:opacity-50"
        >
          {loading ? 'Saqlanmoqda...' : "Xodimni Saqlash"}
        </button>
      </form>
    </div>
  );
}