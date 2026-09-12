import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { useAuthContext } from '../context/AuthContext';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import Select from 'react-select'; // react-select import qilindi

export default function CreateTask() {
  const { user, userData } = useAuthContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [deadline, setDeadline] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Firestore'dan xodimlar ro'yxatini yuklash
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const list = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setEmployees(list);
      } catch (err) {
        console.error("Xodimlarni olishda xatolik:", err);
      }
    };

    fetchEmployees();
  }, []);

  // Xodimlarni react-select uchun { value, label } formatiga o'tkazish
  const employeeOptions = employees.map((emp) => ({
    value: emp.id,
    label: `${emp.fullName || emp.email} ${emp.workplace ? `(${emp.workplace})` : ''}`
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (!assignedTo) {
      setMessage({ type: 'error', text: "Mas'ul xodimni tanlang!" });
      setLoading(false);
      return;
    }

    try {
      await addDoc(collection(db, 'tasks'), {
        title: title.trim(),
        description: description.trim(),
        assignedTo: assignedTo,
        createdBy: user?.uid || '',
        creatorName: userData?.fullName || 'Rahbariyat',
        status: 'pending',
        deadline: deadline,
        createdAt: serverTimestamp()
      });

      setMessage({ type: 'success', text: 'Topshiriq muvaffaqiyatli biriktirildi!' });
      setTitle('');
      setDescription('');
      setAssignedTo('');
      setDeadline('');
    } catch (err) {
      console.error("Topshiriq saqlashda xatolik:", err);
      setMessage({ type: 'error', text: 'Xatolik yuz berdi: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow-md border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Send className="w-6 h-6 text-blue-600" /> Yangi Topshiriq Yuborish
      </h2>

      {message.text && (
        <div className={`mb-4 p-4 rounded-xl text-sm flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Topshiriq Nomi</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Masalan: Hisobot tayyorlash"
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mas'ul Xodim</label>
          <Select
            options={employeeOptions}
            value={employeeOptions.find(opt => opt.value === assignedTo) || null}
            onChange={(selectedOption) => setAssignedTo(selectedOption ? selectedOption.value : '')}
            placeholder="-- Xodimni izlang va tanlang --"
            isSearchable={true}
            isClearable={true}
            noOptionsMessage={() => "Xodim topilmadi"}
            className="text-sm"
            styles={{
              control: (base, state) => ({
                ...base,
                borderRadius: '0.75rem', // rounded-xl
                borderColor: state.isFocused ? '#3b82f6' : '#cbd5e1', // focus va oddiy holat
                padding: '2px',
                boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none',
                '&:hover': {
                  borderColor: '#3b82f6'
                }
              })
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Topshiriq Mazmuni</label>
          <textarea
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Topshiriq yuzasidan batafsil izoh..."
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Bajarilish Muddat (Deadline)</label>
          <input
            type="date"
            required
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition shadow-md disabled:opacity-50"
        >
          {loading ? 'Biriktirilmoqda...' : 'Topshiriqni Yuborish'}
        </button>
      </form>
    </div>
  );
}