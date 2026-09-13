import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { useAuthContext } from '../context/AuthContext';
import { Send, CheckCircle, AlertCircle, Mic, Square, Play, Pause, Phone, ArrowLeft, Trash2 } from 'lucide-react';
import Select from 'react-select';

export default function CreateTask() {
  const navigate = useNavigate();
  const { user, userData } = useAuthContext();
  const [title, setTitle] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [deadline, setDeadline] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Ovozli xabar uchun state'lar
  const [isRecording, setIsRecording] = useState(false);
  const [audioBase64, setAudioBase64] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioPlayerRef = useRef(null);

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

  // Ovoz yozishni boshlash
  const startRecording = async () => {
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlobObj = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const localUrl = URL.createObjectURL(audioBlobObj);
        setAudioUrl(localUrl);

        // Blob ni Base64 matnga o'tkazish (Storage'ga yuklamaslik uchun)
        const reader = new FileReader();
        reader.readAsDataURL(audioBlobObj);
        reader.onloadend = () => {
          setAudioBase64(reader.result);
        };
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mikrofondan foydalanish xatosi:", err);
      alert("Mikrofonga ruxsat berilmadi yoki qurilmangizda mikrofon topilmadi.");
    }
  };

  // Ovoz yozishni to'xtatish
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
  };

  const togglePlayAudio = () => {
    if (!audioPlayerRef.current) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const deleteAudio = () => {
    setAudioBase64(null);
    setAudioUrl(null);
    setIsPlaying(false);
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
      // To'g'ridan-to'g'ri Firestore bazasiga audio Base64 matnini saqlaymiz
      await addDoc(collection(db, 'tasks'), {
        title: title.trim(),
        audioBase64: audioBase64 || '', // Storage ishlatmasdan baza ichiga saqlanadi
        assignedTo: assignedTo,
        createdBy: user?.uid || '',
        creatorName: userData?.fullName || 'Rahbariyat',
        status: 'pending',
        deadline: deadline,
        createdAt: serverTimestamp()
      });

      setMessage({ type: 'success', text: 'Topshiriq muvaffaqiyatli yuborildi!' });
      setTitle('');
      setAssignedTo('');
      setDeadline('');
      setAudioBase64(null);
      setAudioUrl(null);
    } catch (err) {
      console.error("Topshiriq saqlashda xatolik:", err);
      setMessage({ type: 'error', text: 'Xatolik yuz berdi: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const selectedEmployee = employeeOptions.find(opt => opt.value === assignedTo);

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow-md border border-slate-200 my-4 space-y-4">
      
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
          />

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

        {/* OVOZLI XABAR */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Topshiriq Mazmuni (Ovozli Xabar)</label>
          
          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            {!audioUrl ? (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-slate-500">
                  {isRecording ? "🔴 Ovoz yozilmoqda..." : "Mikrofonni bosing va gapiring"}
                </span>
                
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition shadow-sm"
                  >
                    <Mic className="w-4 h-4" /> Ovoz yozish
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition animate-pulse shadow-sm"
                  >
                    <Square className="w-4 h-4" /> To'xtatish
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={togglePlayAudio}
                    className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                  <span className="text-xs font-medium text-slate-700">Ovozli xabar tayyor 🎙️</span>
                  <audio 
                    ref={audioPlayerRef} 
                    src={audioUrl} 
                    onEnded={() => setIsPlaying(false)} 
                    className="hidden" 
                  />
                </div>

                <button
                  type="button"
                  onClick={deleteAudio}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                  title="Ovozni o'chirish / Qaytadan yozish"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
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
          {loading ? 'Yuborilmoqda...' : 'Topshiriqni Yuborish'}
        </button>
      </form>
    </div>
  );
}