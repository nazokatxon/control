import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";

export const loginUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Foydalanuvchi rolini Firestore'dan olamiz
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (userDoc.exists()) {
    return { user, role: userDoc.data().role };
  } else {
    throw new Error("Foydalanuvchi rolu topilmadi!");
  }
};

export const logoutUser = async () => {
  await signOut(auth);
};