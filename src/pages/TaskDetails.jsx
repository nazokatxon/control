import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTaskById, updateTaskStatus } from "../services/taskService";
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
    if (e) e.preventDefault();
    setUpdating(true);
    try {
      await updateTaskStatus(id, status, comment, imageUrl || "");
      alert("Hisobot va status muvaffaqiyatli yangilandi!");
      navigate("/tasks");
    } catch (err) {
      console.error(err);
      alert("Yangilashda xatolik yuz berdi");
    } finally {
      setUpdating(false);
    }
  };

  // Bir bosishda tezkor "Bajarildi" statusiga o'tkazish
  const handleQuickComplete = async () => {
    setUpdating(true);
    try {
      await updateTaskStatus(id, "completed", comment, imageUrl || "");
      setStatus("completed");
      alert("Topshiriq bajarildi deb belgilandi!");
      navigate("/tasks");
    } catch (err) {
      console.error(err);
      alert("Xatolik yuz berdi");
    } finally {
      setUpdating(false);
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

      {/* Xodim uchun hisobot topshirish formasi */}
      {userRole === "employee" && (
        <form onSubmit={handleUpdate} className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Topshiriq Holatini Yangilash</h3>
            {status !== "completed" && (
              <button
                type="button"
                onClick={handleQuickComplete}
                disabled={updating}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
              >
                ✅ Tezkor "Bajarildi" qilish
              </button>
            )}
          </div>
          
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rasm havola (Foto-hisobot URL) <span className="text-gray-400 font-normal">(ixtiyoriy)</span>
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://... (bo'sh qolishi ham mumkin)"
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

      {/* Topshirilgan hisobot moduli */}
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