import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null); // Ism, familiya va qo'shimcha ma'lumotlar uchun
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        try {
          // Firestore'dan foydalanuvchi ma'lumotlari va rolini olish
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserRole(data.role || "xodim");
            setUserData(data);
          } else {
            // Agar Firestore'da hali hujjat ochilmagan bo'lsa
            setUserRole("xodim");
            setUserData(null);
          }
        } catch (error) {
          console.error("Rol va foydalanuvchi ma'lumotlarini olishda xatolik:", error);
          setUserRole("xodim");
        }
      } else {
        setUser(null);
        setUserRole(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Chiqish funksiyasi
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserRole(null);
      setUserData(null);
    } catch (error) {
      console.error("Chiqishda xatolik:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userRole, userData, loading, logout }}>
      {!loading ? children : (
        <div className="flex justify-center items-center h-screen bg-slate-900 text-white">
          <p className="text-lg font-medium animate-pulse">Autentifikatsiya tekshirilmoqda...</p>
        </div>
      )}
    </AuthContext.Provider>
  );
};

// Har ikkala nomda ham chaqirish imkoniyati
export const useAuth = () => useContext(AuthContext);
export const useAuthContext = () => useContext(AuthContext);