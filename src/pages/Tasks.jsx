import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { getAllTasks, getEmployeeTasks, updateTaskStatus } from "../services/taskService";
import { db } from "../firebase/config";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import { Paperclip, PlayCircle, CheckCircle, Eye, ArrowLeft } from "lucide-react";

export default function Tasks() {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const currentStatusParam = searchParams.get("status") || "all";

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [activeFilter, setActiveFilter] = useState(currentStatusParam);

  const isManager = userRole === "hokim" || userRole === "admin" || userRole === "yordamchi";
  const isHokim = userRole === "hokim" || userRole === "admin";

  useEffect(() => {
    fetchTasks();
  }, [user, userRole]);

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

  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      setUpdatingId(taskId);
      await updateTaskStatus(taskId, newStatus);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error("Statusni yangilashda xatolik:", err);
      alert("Statusni yangilashda xatolik yuz berdi");
    } finally {
      setUpdatingId(null);
    }
  };

  // Hokim "Ko'rish" ni bosganda holatni "Ko'rildi" qilish va 0.5 ball qo'shish
  const handleHokimView = async (task) => {
    // Agar allaqachon ko'rilgan bo'lsa, qayta bajarilmaydi
    if (task.status === "ko'rildi" || task.status === "viewed") return;

    try {
      setUpdatingId(task.id);
      const taskRef = doc(db, "tasks", task.id);
      
      // 1. Vazifa statusini "ko'rildi" ga o'zgartirish
      await updateDoc(taskRef, { status: "ko'rildi" });

      // 2. Agar xodimga biriktirilgan bo'lsa, uning baliga 0.5 qo'shish
      if (task.assignedTo) {
        const userRef = doc(db, "users", task.assignedTo);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          // Ball mavjud bo'lmasa 0 dan boshlab increment qilamiz
          const currentPoints = userSnap.data().points || 0;
          await updateDoc(userRef, { points: currentPoints + 0.5 });
        }
      }

      // Local state'ni yangilash
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: "ko'rildi" } : t));
    } catch (err) {
      console.error("Ko'rildi qilishda xatolik:", err);
      alert("Xatolik yuz berdi");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const st = status?.toLowerCase();
    switch (st) {
      case "completed":
      case "bajarildi":
        return <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-semibold">🟢 Bajarildi</span>;
      case "ko'rildi":
      case "viewed":
        return <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-semibold">👁️ Ko'rildi</span>;
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

  const filteredTasks = tasks.filter((task) => {
    const st = task.status?.toLowerCase() || "";
    if (activeFilter === "all") return true;
    if (activeFilter === "in_progress") {
      return st === "in_progress" || st === "jarayonda" || st === "pending" || st === "kutilmoqda";
    }
    if (activeFilter === "completed") {
      return st === "completed" || st === "bajarildi" || st === "ko'rildi" || st === "viewed";
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
          {filteredTasks.map((task) => {
            const isCompletedByEmployee = task.status === "completed" || task.status === "COMPLETED" || task.status === "bajarildi";
            const isAlreadyViewed = task.status === "ko'rildi" || task.status === "viewed";

            return (
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

                {/* AMALLAR QISMI */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {/* XODIM UCHUN */}
                  {!isManager && task.status !== "completed" && task.status !== "COMPLETED" && task.status !== "bajarildi" && !isAlreadyViewed && (
                    <div className="flex items-center gap-2">
                      {task.status !== "in_progress" && task.status !== "IN_PROGRESS" && task.status !== "jarayonda" && (
                        <button
                          onClick={() => handleStatusUpdate(task.id, "in_progress")}
                          disabled={updatingId === task.id}
                          className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition disabled:opacity-50"
                        >
                          <PlayCircle className="w-3.5 h-3.5" /> Boshlash
                        </button>
                      )}

                      <button
                        onClick={() => handleStatusUpdate(task.id, "completed")}
                        disabled={updatingId === task.id}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{updatingId === task.id ? "Saqlanmoqda..." : "Bajarildi"}</span>
                      </button>
                    </div>
                  )}

                  {/* HOKIM UCHUN: Agar xodim bajarib qo'ygan bo'lsa, "Ko'rish" tugmasi chiqadi */}
                  {isHokim && isCompletedByEmployee ? (
                    <button
                      onClick={() => handleHokimView(task)}
                      disabled={updatingId === task.id}
                      className="w-full flex items-center justify-center gap-1 text-xs font-semibold text-white bg-blue-600 py-2.5 rounded-xl hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{updatingId === task.id ? "Yuklanmoqda..." : "Ko'rish"}</span>
                    </button>
                  ) : isHokim && isAlreadyViewed ? (
                    <div className="text-center text-xs font-semibold text-emerald-600 bg-emerald-50 py-2 rounded-xl">
                      ✓ Ko'rildi (0.5 ball berildi)
                    </div>
                  ) : (
                    <Link
                      to={`/tasks/${task.id}`}
                      className="block text-center text-xs font-semibold text-slate-700 bg-slate-100 py-2 rounded-xl hover:bg-slate-200 transition"
                    >
                      Batafsil Ko'rish →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}