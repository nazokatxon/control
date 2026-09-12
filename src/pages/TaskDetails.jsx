import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTaskById, updateTaskStatus, uploadTaskVoice } from "../services/taskService";
import { useAuth } from "../hooks/useAuth";

export default function TaskDetails() {
  const { id } = useParams();
  const { userRole } = useAuth();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [status, setStatus] = useState("in_progress");
  const [comment, setComment] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Ovoz yozish va saqlash uchun state'lar
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [uploadingVoice, setUploadingVoice] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Topshiriqni qayta yuklash funksiyasi
  const reloadTask = async () => {
    const data = await getTaskById(id);
    if (data) {
      setTask(data);
    }
  };

  useEffect(() => {
    const fetchTask = async () => {
      const data = await getTaskById(id);
      if (data) {
        setTask(data);
        setStatus(data.status || "in_progress");
        if (data.report) {
          setComment(data.report.comment || "");
          setImageUrl(data.report.imageUrl || "");
        }
      }
      setLoading(false);
    };
    fetchTask();
  }, [id]);

  // Status va Hisobotni yangilash
  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await updateTaskStatus(id, status, comment, imageUrl);
      alert("Hisobot va status munosabati yangilandi!");
      navigate("/tasks");
    } catch (err) {
      console.error(err);
      alert("Yangilashda xatolik yuz berdi");
    } finally {
      setUpdating(false);
    }
  };

  // 1. Ovoz yozishni boshlash
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      alert("Mikrofon ishlamadi yoki unga ruxsat berilmadi!");
    }
  };

  // 2. Ovoz yozishni to'xtatish
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
    }
  };

  // 3. Ovozli xabarni Firebase Storage va Firestore'ga saqlash
  const handleSendVoice = async () => {
    if (!audioBlob) return;
    setUploadingVoice(true);
    try {
      await uploadTaskVoice(id, audioBlob);
      setAudioBlob(null);
      setAudioUrl(null);
      await reloadTask(); // Yozib bo'lingach, topshiriq ma'lumotlarini yangilaymiz
    } catch (err) {
      console.error(err);
      alert("Ovozli xabarni yuborishda xatolik yuz berdi");
    } finally {
      setUploadingVoice(false);
    }
  };

  // Statuslarni o'zbekcha dizaynda ko'rsatish
  const renderStatusBadge = (st) => {
    const statusKey = st?.toLowerCase();
    switch (statusKey) {
      case "in_progress":
      case "jarayonda":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
            🟡 Jarayonda
          </span>
        );
      case "completed":
      case "bajarildi":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
            ✅ Bajarildi
          </span>
        );
      case "pending":
      case "kutilmoqda":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
            ⏳ Kutilmoqda
          </span>
        );
      case "overdue":
      case "kechikmoqda":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
            🔴 Kechikmoqda
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            {st || "Noma'lum"}
          </span>
        );
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Yuklanmoqda...</div>;
  if (!task) return <div className="p-8 text-center text-red-500 font-medium">Topshiriq topilmadi!</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-gray-100 mt-8">
      
      {/* Sarlavha va Orqaga */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800">{task.title || task.name || "Topshiriq"}</h2>
        <button
          onClick={() => navigate(-1)}
          className="text-xs font-medium text-gray-500 hover:text-blue-600 transition"
        >
          ← Orqaga
        </button>
      </div>

      {/* Asosiy ma'lumotlar */}
      <div className="bg-gray-50/70 p-5 rounded-xl mb-6 space-y-3 text-sm border border-gray-100">
        <div className="flex items-start gap-2">
          <span className="font-semibold text-gray-700 min-w-[110px]">Batafsil:</span>
          <span className="text-gray-600 break-words">{task.description || "Kiritilmagan"}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-700 min-w-[110px]">Mahalla:</span>
          <span className="text-gray-600">
            {task.mahalla || <span className="text-gray-400 italic">Kiritilmagan</span>}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-700 min-w-[110px]">Muddati:</span>
          <span className="text-gray-600 font-medium">{task.deadline || "Belgilanmagan"}</span>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <span className="font-semibold text-gray-700 min-w-[110px]">Hozirgi holati:</span>
          <div>{renderStatusBadge(task.status)}</div>
        </div>
      </div>

      {/* Ovozli Xabarlar Moduli */}
      <div className="border-t border-gray-100 pt-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Ovozli xabarlar</h3>

        {/* 1. Kelgan/Yozilgan ovozlar ro'yxati */}
        <div className="space-y-2 mb-4">
          {task.voices && task.voices.length > 0 ? (
            task.voices.map((v, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <audio src={v.url} controls className="h-8 w-full max-w-md" />
                <span className="text-xs text-gray-400 font-mono">
                  {v.createdAt ? new Date(v.createdAt).toLocaleDateString() : ""}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-400 italic">Ovozli xabarlar mavjud emas</p>
          )}
        </div>

        {/* 2. Yangi Ovoz yozish paneli */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-600">Ovozli xabar yuborish</span>
            
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5 shadow-sm"
              >
                🎙 Ovoz yozish
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-xs font-medium animate-pulse flex items-center gap-1.5"
              >
                ⏹ To'xtatish
              </button>
            )}
          </div>

          {/* Yozilgan audio pleyeri va Yuborish tugmasi */}
          {audioUrl && (
            <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
              <audio src={audioUrl} controls className="h-8 w-full" />
              <button
                type="button"
                onClick={handleSendVoice}
                disabled={uploadingVoice}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50 whitespace-nowrap shadow-sm"
              >
                {uploadingVoice ? "Yuborilmoqda..." : "Yuborish 🚀"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Xodim uchun hisobot topshirish formasi */}
      {userRole === "employee" && (
        <form onSubmit={handleUpdate} className="space-y-4 border-t border-gray-100 pt-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-800">Topshiriq Holatini Yangilash</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="in_progress">🟡 Jarayonda</option>
              <option value="completed">🟢 Bajarildi</option>
              <option value="overdue">🔴 Kechikmoqda</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bajarilgan ish bo'yicha izoh</label>
            <textarea
              rows="3"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ish natijasi haqida qisqacha..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rasm havola (Foto-hisobot URL)</label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://..."
            />
          </div>

          <button
            type="submit"
            disabled={updating}
            className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
          >
            {updating ? "Saqlanmoqda..." : "Hisobotni Saqlash"}
          </button>
        </form>
      )}

      {/* Hokim va boshqa rollar uchun topshirilgan hisobot moduli */}
      {task.report && (task.report.comment || task.report.imageUrl) && (
        <div className="border-t border-gray-100 pt-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Xodimlarning Hisoboti</h3>
          
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3">
            {task.report.comment && (
              <p className="text-gray-700 text-sm leading-relaxed">
                <strong className="text-blue-900">Izoh:</strong> {task.report.comment}
              </p>
            )}

            {task.report.imageUrl && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Foto hisobot:</p>
                <img
                  src={task.report.imageUrl}
                  alt="Foto hisobot"
                  className="max-h-64 rounded-xl object-cover border border-gray-200 shadow-sm"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}