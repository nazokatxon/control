import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { useAuthContext } from '../context/AuthContext';
import { Send, CheckCircle, AlertCircle, Mic, MicOff, Phone, ArrowLeft } from 'lucide-react';
import Select from 'react-select';

export default function CreateTask() {
  const navigate = useNavigate();
  const { user, userData } = useAuthContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [deadline, setDeadline] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Qaysi biri tinglanayotganini bilish uchun ('title' yoki 'description')
  const [activeField, setActiveField] = useState(null);

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

  const employeeOptions = employees.map((emp) => ({
    value: emp.id,
    label: `${emp.fullName || emp.email} ${emp.workplace ? `(${emp.workplace})` : ''}`,
    phone: emp.phone || ''
  }));

  // Ovozli yozish funksiyasi (universal: title yoki description uchun)
  const handleVoiceInput = (field) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Sizning brauzeringiz ovozli kiritishni qo'llab-quvvatlamaydi. Iltimos, Google Chrome dan foydalaning.");
      return;
    }

    if (activeField === field) {
      setActiveField(null);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'uz-UZ'; 
    recognition.interimResults = true; 
    recognition.continuous = true; 

    recognition.onstart = () => {
      setActiveField(field);
    };

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      if (field === 'title') {
        setTitle(transcript);
      } else if (field === 'description') {
        setDescription(transcript);
      }
    };

    recognition.onerror = (event) => {
      console.error("Ovozni aniqlashda xatolik:", event.error);
      setActiveField(null);
    };

    recognition.onend = () => {
      setActiveField(null);
    };

    recognition.start();
  };

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

  // Tanlangan xodim obyektini topib olish
  const selectedEmployee = employeeOptions.find(opt => opt.value === assignedTo);

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow-md border border-slate-200 my-4 space-y-4">
      
      {/* ORQAGA QAYTISH TUGMASI */}
      <div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Orqaga</span>
        </button>
      </div>

      <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
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
        {/* Topshiriq Nomi */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-slate-700">Topshiriq Nomi</label>
            <button
              type="button"
              onClick={() => handleVoiceInput('title')}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl font-semibold transition ${
                activeField === 'title' 
                  ? 'bg-rose-500 text-white animate-pulse' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {activeField === 'title' ? (
                <>
                  <MicOff className="w-3.5 h-3.5" /> Tinglanmoqda...
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-blue-600" /> Ovoz bilan yozish
                </>
              )}
            </button>
          </div>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Masalan: Hisobot tayyorlash"
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Mas'ul Xodim */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mas'ul Xodim</label>
          <Select
            options={employeeOptions}
            value={selectedEmployee || null}
            onChange={(selectedOption) => setAssignedTo(selectedOption ? selectedOption.value : '')}
            placeholder="-- Xodimni izlang va tanlang --"
            isSearchable={true}
            isClearable={true}
            noOptionsMessage={() => "Xodim topilmadi"}
            className="text-sm"
            styles={{
              control: (base, state) => ({
                ...base,
                borderRadius: '0.75rem',
                borderColor: state.isFocused ? '#3b82f6' : '#cbd5e1',
                padding: '2px',
                boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none',
                '&:hover': {
                  borderColor: '#3b82f6'
                }
              })
            }}
          />

          {/* Tanlangan xodimning telefon raqami va qo'ng'iroq qilish tugmasi */}
          {assignedTo && (
            <div className="mt-2 text-xs flex items-center gap-1.5 text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="font-medium text-slate-700">Xodim raqami:</span>
              {selectedEmployee?.phone ? (
                <a 
                  href={`tel:${selectedEmployee.phone}`}
                  className="text-blue-600 font-bold hover:underline flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
                >
                  <Phone className="w-3.5 h-3.5" /> {selectedEmployee.phone}
                </a>
              ) : (
                <span className="text-amber-600 italic">Bu xodimga telefon raqam kiritilmagan</span>
              )}
            </div>
          )}
        </div>

        {/* Topshiriq Mazmuni */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-slate-700">Topshiriq Mazmuni</label>
            <button
              type="button"
              onClick={() => handleVoiceInput('description')}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl font-semibold transition ${
                activeField === 'description' 
                  ? 'bg-rose-500 text-white animate-pulse' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {activeField === 'description' ? (
                <>
                  <MicOff className="w-3.5 h-3.5" /> Tinglanmoqda...
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-blue-600" /> Ovoz bilan yozish
                </>
              )}
            </button>
          </div>
          <textarea
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Topshiriq yuzasidan batafsil izoh..."
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Bajarilish Muddat */}
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