import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Calendar as CalendarIcon, Clock, User, Plus, Trash2, ArrowLeft, AlertCircle, Search } from 'lucide-react';

export default function Uchrashuvlar() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [employees, setEmployees] = useState([]); // Xodimlar ro'yxati
  const [person, setPerson] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchMeetings = async () => {
    try {
      const q = query(collection(db, 'meetings'), orderBy('dateTime', 'asc'));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMeetings(list);
    } catch (err) {
      console.error("Uchrashuvlarni olishda xatolik:", err);
    }
  };

  // Bazadan xodimlarni olish (kolleksiya nomi loyihangizga qarab 'users' yoki 'employees' bo'lishi mumkin)
  const fetchEmployees = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'users')); 
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEmployees(list);
    } catch (err) {
      console.error("Xodimlarni olishda xatolik:", err);
    }
  };

  useEffect(() => {
    fetchMeetings();
    fetchEmployees();
  }, []);

  // Qidiruv so'ziga mos keluvchi xodimlar
  const filteredEmployees = employees.filter(emp => 
    (emp.name || emp.fullName || emp.email || "").toLowerCase().includes(person.toLowerCase())
  );

  const handleAddMeeting = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!person.trim() || !dateTime) return;

    // Vaqt bandligini tekshirish
    const isConflict = meetings.some(meeting => meeting.dateTime === dateTime);
    if (isConflict) {
      setErrorMsg("Diqqat! Bu sana va vaqt allaqachon band qilingan. Iltimos, boshqa vaqtni tanlang.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'meetings'), {
        person,
        dateTime,
        createdAt: serverTimestamp()
      });
      setPerson('');
      setDateTime('');
      fetchMeetings();
    } catch (err) {
      console.error("Uchrashuv qo'shishda xatolik:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeeting = async (id) => {
    if (!window.confirm("Ushbu uchrashuvni o'chirishni tasdiqlaysizmi?")) return;
    try {
      await deleteDoc(doc(db, 'meetings', id));
      setMeetings(meetings.filter(m => m.id !== id));
    } catch (err) {
      console.error("O'chirishda xatolik:", err);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 pb-24 md:pb-6">
      
      {/* ORQAGA QAYTISH TUGMASI */}
      <div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Orqaga</span>
        </button>
      </div>

      <div>
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
          <CalendarIcon className="w-6 h-6 text-blue-600" />
          <span>Hokimning Uchrashuvlar Jadvali</span>
        </h2>
        <p className="text-xs text-slate-500">Rejalashtirilgan uchrashuvlarni xodimlar bo'yicha boshqarish</p>
      </div>

      {/* Uchrashuv qo'shish formasi */}
      <form onSubmit={handleAddMeeting} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 relative">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
          <Plus className="w-4 h-4 text-blue-500" />
          <span>Yangi uchrashuv qo'shish</span>
        </h3>
        
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-3">
          {/* Xodimni qidirib topishinputi */}
          <div className="relative">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Uchrashuvchi shaxs / Tashkilot</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Masalan: 2-maktab direktori yoki xodim ismi"
                value={person}
                onChange={(e) => {
                  setPerson(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="w-full px-4 py-2.5 pl-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>

            {/* Qidiruv natijalari dropdown ro'yxati */}
            {showDropdown && person.trim() !== '' && filteredEmployees.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {filteredEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    onClick={() => {
                      setPerson(emp.name || emp.fullName || emp.email);
                      setShowDropdown(false);
                    }}
                    className="px-4 py-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between transition"
                  >
                    <span>{emp.name || emp.fullName || emp.email}</span>
                    <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">Xodim</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Sanasi va vaqti</label>
            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>{loading ? "Qo'shilmoqda..." : "Uchrashuvni qo'shish"}</span>
        </button>
      </form>

      {/* Uchrashuvlar ro'yxati */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-800 dark:text-white">Rejalashtirilgan uchrashuvlar</h3>
          <span className="text-xs text-slate-400">Vaqti va xodimlar nazoratda</span>
        </div>

        {meetings.length === 0 ? (
          <p className="p-6 text-xs text-slate-400 text-center">Hozircha uchrashuvlar mavjud emas.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {meetings.map((meeting) => (
              <div key={meeting.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-slate-800 dark:text-white">{meeting.person}</h4>
                    <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{meeting.dateTime ? meeting.dateTime.replace('T', ' ') : ''}</span>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteMeeting(meeting.id)}
                  className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-xl transition"
                  title="O'chirish"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}