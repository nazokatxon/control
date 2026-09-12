import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getAllTasks, getEmployeeTasks, updateTaskStatus, uploadTaskReport } from "../services/taskService";
import { useAuth } from "../hooks/useAuth";
import { Paperclip, PlayCircle, Upload } from "lucide-react";

export default function Tasks() {
  const { user, userRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // URL'dan kelgan status bo'yicha boshlang'ich filterni aniqlash
  const currentStatusParam = searchParams.get("status") || "all";

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);
  const [activeFilter, setActiveFilter] = useState(currentStatusParam);

  const isManager = userRole === "hokim" || userRole === "admin" || userRole === "yordamchi";

  useEffect(() => {
    fetchTasks();
  }, [user, userRole]);

  // URL'dagi status parametr o'zgarganda activeFilter'ni yangilash
  useEffect(() => {
    setActiveFilter(searchParams.get("status") || "all");
  }, [searchParams]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let data = [];
      if (isManager) {
        data = await getAllTasks();
      } else {
        data = await getEmployeeTasks(user?.uid);
      }
      setTasks(data || []);
    } catch (err) {
      console.error("Topshiriqlarni olishda xatolik:", err);
    } finally {
      setLoading(false);
    }
  };

  // Statusni o'zgartirish
  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error("Statusni yangilashda xatolik:", err);
    }
  };

  // Fayl / Hisobot yuklash
  const handleFileUpload = async (taskId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingId(taskId);
      const fileUrl = await uploadTaskReport(taskId, file);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, fileUrl, status: "completed" } : t));
    } catch (err) {
      console.error("Fayl yuklashda xatolik:", err);
    } finally {
      setUploadingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const st = status?.toLowerCase();
    switch (st) {
      case "completed":
      case "bajarildi":
        return <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-semibold">🟢 Bajarildi</span>;
      case "in_progress":
      case "jarayonda":
      case "pending":
      case "kutilmoqda":
        return <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-semibold">🟡 Jarayonda</span>;
      case "overdue":
      case "kechikmoqda":
        return <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs px-2.5 py-1 rounded-full font-semibold">🔴 Kechikkan</span>;
      default:
        return <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full font-semibold">⏳ Kutilmoqda</span>;
    }
  };

  // Tanlangan tab/filter bo'yicha ro'yxatni saralash
  const filteredTasks = tasks.filter((task) => {
    const st = task.status?.toLowerCase() || "";
    if (activeFilter === "all") return true;
    if (activeFilter === "in_progress") {
      return st === "in_progress" || st === "jarayonda" || st === "pending" || st === "kutilmoqda";
    }
    if (activeFilter === "completed") {
      return st === "completed" || st === "bajarildi";
    }
    if (activeFilter === "overdue") {
      return st === "overdue" || st === "kechikmoqda";
    }
    return true;
  });

  const handleFilterChange = (filterType) => {
    setActiveFilter(filterType);
    setSearchParams({ status: filterType });
  };

  if (loading) return <div className="p-8 text-center text-slate-600 font-medium">Topshiriqlar yuklanmoqda...</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Topshiriqlar Ro'yxati</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Barcha yuklatilgan topshiriqlar va ularning ijro holati</p>
        </div>

        {isManager && (
          <Link
            to="/tasks/create"
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition text-center shadow-md shadow-blue-200"
          >
            + Yangi Topshiriq
          </Link>
        )}
      </div>

      {/* FILTER TABLARI */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => handleFilterChange("all")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            activeFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Barchasi ({tasks.length})
        </button>
        <button
          onClick={() => handleFilterChange("in_progress")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            activeFilter === "in_progress" ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100"
          }`}
        >
          Jarayonda
        </button>
        <button
          onClick={() => handleFilterChange("completed")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            activeFilter === "completed" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          }`}
        >
          Bajarilgan
        </button>
        <button
          onClick={() => handleFilterChange("overdue")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            activeFilter === "overdue" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700 hover:bg-rose-100"
          }`}
        >
          Kechikmoqda
        </button>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
          Ushbu status bo'yicha hech qanday topshiriq topilmadi.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <div key={task.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between space-y-4 hover:shadow-md transition">
              <div>
                <div className="flex justify-between items-start gap-2 mb-3">
                  <h3 className="font-bold text-slate-800 text-base leading-snug">{task.title}</h3>
                  {getStatusBadge(task.status)}
                </div>

                <p className="text-slate-600 text-xs sm:text-sm mb-4 line-clamp-3">{task.description || task.batafsil}</p>

                <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-600 space-y-1.5 mb-2">
                  <p><strong className="text-slate-800">📍 Mahalla:</strong> {task.mahalla || "Kiritilmagan"}</p>
                  <p><strong className="text-slate-800">📅 Muddat:</strong> {task.deadline || task.muddati}</p>
                  {task.fileUrl && (
                    <p className="flex items-center gap-1 text-blue-600 font-medium pt-1">
                      <Paperclip className="w-3.5 h-3.5" />
                      <a href={task.fileUrl} target="_blank" rel="noreferrer" className="underline hover:text-blue-800">
                        Biriktirilgan faylni ko'rish
                      </a>
                    </p>
                  )}
                </div>
              </div>

              {/* XODIM UCHUN STATUS VA FAYL BIRIKTIRISH TEZKOR AMALLARI */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                {!isManager && task.status !== "completed" && task.status !== "COMPLETED" && (
                  <div className="flex items-center gap-2">
                    {task.status !== "in_progress" && task.status !== "IN_PROGRESS" && (
                      <button
                        onClick={() => handleStatusUpdate(task.id, "in_progress")}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition"
                      >
                        <PlayCircle className="w-3.5 h-3.5" /> Boshlash
                      </button>
                    )}

                    <label className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingId === task.id ? "Yuklanmoqda..." : "Fayl / Hisobot"}</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleFileUpload(task.id, e)}
                        disabled={uploadingId === task.id}
                      />
                    </label>
                  </div>
                )}

                <Link
                  to={`/tasks/${task.id}`}
                  className="block text-center text-xs font-semibold text-slate-700 bg-slate-100 py-2 rounded-xl hover:bg-slate-200 transition"
                >
                  Batafsil Ko'rish →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}