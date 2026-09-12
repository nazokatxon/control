import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  deleteDoc, 
  writeBatch,
  where,
  or,
  and,
  getDocs
} from 'firebase/firestore';
import { useAuthContext } from '../context/AuthContext';
import { 
  Send, Mic, Square, User, Volume2, Reply, Edit2, 
  Trash2, X, CornerDownRight, MoreVertical, Search, 
  Image as ImageIcon, Check, CheckCheck, Trash
} from 'lucide-react';

export default function Chat() {
  const { user } = useAuthContext();
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  // O'qilmagan xabarlar va typing holatlari
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  const [activeMenuId, setActiveMenuId] = useState(null);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false); // Headerdagi 3-nuqta menyusi uchun
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);

  const [isRecording, setIsRecording] = useState(false);
  const [audioBase64, setAudioBase64] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const [imageBase64, setImageBase64] = useState(null);
  const imageInputRef = useRef(null);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOtherTyping]);

  // 1. ONLAYN / OFLAYN / TYPING STATUSINI BOSHQARISH
  useEffect(() => {
    if (!user?.uid) return;
    const userDocRef = doc(db, 'users', user.uid);

    const setOnline = async () => {
      try {
        await updateDoc(userDocRef, {
          isOnline: true,
          lastSeen: serverTimestamp()
        });
      } catch (err) {
        console.error("Statusni yangilashda xatolik:", err);
      }
    };

    const setOffline = async () => {
      try {
        await updateDoc(userDocRef, {
          isOnline: false,
          isTypingTo: null,
          lastSeen: serverTimestamp()
        });
      } catch (err) {
        console.error("Statusni yangilashda xatolik:", err);
      }
    };

    setOnline();

    const handleFocus = () => setOnline();
    const handleBlur = () => setOffline();
    const handleUnload = () => setOffline();

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      setOffline();
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [user]);

  // 2. Foydalanuvchilarni real-time yuklash
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList = [];
      snapshot.forEach((docSnap) => {
        if (docSnap.id !== user?.uid) {
          const data = docSnap.data();
          usersList.push({ id: docSnap.id, ...data });

          if (selectedUser && docSnap.id === selectedUser.id) {
            setIsOtherTyping(data.isTypingTo === user.uid);
          }
        }
      });
      setEmployees(usersList);
    });

    return () => unsubscribe();
  }, [user, selectedUser]);

  // 3. O'QILMAGAN xabarlarni hisoblash
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(collection(db, 'chats'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const counts = {};
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.receiverId === user.uid && data.isRead === false) {
          const senderId = data.senderId;
          counts[senderId] = (counts[senderId] || 0) + 1;
        }
      });
      setUnreadCounts(counts);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const checkStartsWithWord = (text) => {
      if (!text) return false;
      return text.toLowerCase().split(/[\s._@-]+/).some((word) => word.startsWith(q));
    };
    return checkStartsWithWord(emp.fullName) || checkStartsWithWord(emp.email) || checkStartsWithWord(emp.role);
  });

  // 4. Tanlangan chat xabarlarini yuklash va O'QILGAN deb belgilash
  useEffect(() => {
    if (!selectedUser || !user?.uid) return;

    const q = query(
      collection(db, 'chats'),
      or(
        and(where('senderId', '==', user.uid), where('receiverId', '==', selectedUser.id)),
        and(where('senderId', '==', selectedUser.id), where('receiverId', '==', user.uid))
      ),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const msgs = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      setMessages(msgs);

      const unreadDocs = snapshot.docs.filter(
        d => d.data().senderId === selectedUser.id && 
             d.data().receiverId === user.uid && 
             d.data().isRead === false
      );

      if (unreadDocs.length > 0) {
        const batch = writeBatch(db);
        unreadDocs.forEach((d) => {
          batch.update(doc(db, 'chats', d.id), { isRead: true });
        });
        await batch.commit();
      }
    });

    return () => unsubscribe();
  }, [selectedUser, user]);

  // CHATNI TOZALASH FUNKSIYASI
  const handleClearChat = async () => {
    if (!selectedUser || !user?.uid) return;
    
    if (window.confirm(`${selectedUser.fullName || selectedUser.email} bilan bo'lgan barcha xabarlarni o'chirmoqchimisiz?`)) {
      try {
        const q = query(
          collection(db, 'chats'),
          or(
            and(where('senderId', '==', user.uid), where('receiverId', '==', selectedUser.id)),
            and(where('senderId', '==', selectedUser.id), where('receiverId', '==', user.uid))
          )
        );

        const snapshot = await getDocs(q);
        const batch = writeBatch(db);

        snapshot.docs.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });

        await batch.commit();
        setIsHeaderMenuOpen(false);
      } catch (err) {
        console.error("Chatni tozalashda xatolik:", err);
        alert("Chatni tozalashda xatolik yuz berdi.");
      }
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (!selectedUser) return;

    const userDocRef = doc(db, 'users', user.uid);
    updateDoc(userDocRef, { isTypingTo: selectedUser.id });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      updateDoc(userDocRef, { isTypingTo: null });
    }, 2000);
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert("Rasm hajmi juda katta! 3MB dan kichik rasm tanlang.");
        return;
      }
      try {
        const base64 = await blobToBase64(file);
        setImageBase64(base64);
      } catch (err) {
        console.error("Rasmni o'qishda xatolik:", err);
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        
        if (audioBlob.size === 0) {
          alert("Ovoz yozilmadi, qaytadan urinib ko'ring.");
          return;
        }

        try {
          const base64 = await blobToBase64(audioBlob);
          setAudioBase64(base64);
        } catch (e) {
          console.error("Base64 ga o'tkazishda xato:", e);
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);
    } catch (err) {
      alert("Mikrofon ishlamayapti yoki ruxsat berilmagan!");
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !audioBase64 && !imageBase64) || !selectedUser) return;

    updateDoc(doc(db, 'users', user.uid), { isTypingTo: null });

    if (editingMessage) {
      try {
        await updateDoc(doc(db, 'chats', editingMessage.id), {
          text: newMessage.trim(),
          isEdited: true
        });
        setEditingMessage(null);
        setNewMessage('');
      } catch (err) {
        console.error("Tahrirlashda xatolik:", err);
      }
      return;
    }

    try {
      let replyText = 'Xabar';
      if (replyTo) {
        if (replyTo.text) replyText = replyTo.text;
        else if (replyTo.image) replyText = 'Rasm';
        else if (replyTo.audio) replyText = 'Ovozli xabar';
      }

      await addDoc(collection(db, 'chats'), {
        senderId: user.uid,
        receiverId: selectedUser.id,
        text: newMessage.trim(),
        audio: audioBase64 || null,
        image: imageBase64 || null,
        replyTo: replyTo ? { id: replyTo.id, text: replyText } : null,
        isRead: false,
        createdAt: serverTimestamp()
      });

      setNewMessage('');
      setAudioBase64(null);
      setImageBase64(null);
      setReplyTo(null);
      if (imageInputRef.current) imageInputRef.current.value = '';
    } catch (err) {
      alert("Xabar yuborishda xatolik!");
      console.error(err);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm("Xabarni o'chirmoqchimisiz?")) return;
    try {
      await deleteDoc(doc(db, 'chats', msgId));
      setActiveMenuId(null);
    } catch (err) {
      console.error("O'chirishda xatolik:", err);
    }
  };

  const startEdit = (msg) => {
    setEditingMessage(msg);
    setNewMessage(msg.text || '');
    setReplyTo(null);
    setActiveMenuId(null);
  };

  const cancelAction = () => {
    setReplyTo(null);
    setEditingMessage(null);
    setNewMessage('');
    setAudioBase64(null);
    setImageBase64(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-[calc(100vh-80px)] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col md:flex-row relative">
      
      {/* CHAP TARAFI - XODIMLAR RO'YXATI */}
      <div className={`w-full md:w-1/3 border-r border-slate-200 bg-slate-50 flex-col ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-200 bg-slate-100 space-y-3">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <span>Xodimlar va Boshliqlar</span>
          </h3>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ism yoki rol bo'yicha qidiruv..."
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-y-auto flex-1 divide-y divide-slate-200">
          {filteredEmployees.length === 0 ? (
            <p className="p-4 text-xs text-slate-400 text-center">Boshqa foydalanuvchilar topilmadi</p>
          ) : (
            filteredEmployees.map((emp) => {
              const userAvatar = emp.photoURL || emp.avatarUrl;

              return (
                <button
                  key={emp.id}
                  onClick={() => { setSelectedUser(emp); cancelAction(); setIsHeaderMenuOpen(false); }}
                  className={`w-full p-4 flex items-center justify-between hover:bg-blue-50 transition text-left ${
                    selectedUser?.id === emp.id ? 'bg-blue-100/70 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="relative shrink-0">
                      {userAvatar ? (
                        <img 
                          src={userAvatar} 
                          alt="Avatar" 
                          className="w-10 h-10 rounded-full object-cover border border-slate-300"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold uppercase">
                          {emp.fullName ? emp.fullName[0] : (emp.email ? emp.email[0] : 'U')}
                        </div>
                      )}
                      
                      <span 
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          emp.isOnline ? 'bg-green-500' : 'bg-slate-400'
                        }`}
                      />
                    </div>

                    <div className="overflow-hidden">
                      <h4 className="font-semibold text-slate-800 text-sm truncate">{emp.fullName || emp.email}</h4>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-600 uppercase font-medium">
                        {emp.role || 'xodim'}
                      </span>
                    </div>
                  </div>

                  {unreadCounts[emp.id] > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shrink-0 shadow-sm ml-2 animate-pulse">
                      {unreadCounts[emp.id]}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* O'NG TARAFI - CHAT OYNASI */}
      <div className={`flex-1 flex-col bg-slate-100 ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
        {selectedUser ? (
          <>
            {/* HEADER BO'LIMI (3 TA NUQTA BO'LIMI SHU YERDA) */}
            <div className="p-3 md:p-4 bg-white border-b border-slate-200 flex items-center justify-between relative z-20">
              <div className="flex items-center gap-3 overflow-hidden">
                <button onClick={() => setSelectedUser(null)} className="md:hidden p-1.5 rounded-lg bg-slate-100 text-slate-600">
                  <X className="w-5 h-5" />
                </button>
                
                {/* User Avatar */}
                <div className="relative shrink-0">
                  {(selectedUser.photoURL || selectedUser.avatarUrl) ? (
                    <img 
                      src={selectedUser.photoURL || selectedUser.avatarUrl} 
                      alt="Avatar" 
                      className="w-10 h-10 rounded-full object-cover border border-slate-300"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold uppercase text-sm">
                      {selectedUser.fullName ? selectedUser.fullName[0] : selectedUser.email[0]}
                    </div>
                  )}

                  <span 
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                      selectedUser.isOnline ? 'bg-green-500' : 'bg-slate-400'
                    }`}
                  />
                </div>

                <div className="overflow-hidden">
                  <h4 className="font-bold text-slate-800 text-sm truncate">{selectedUser.fullName || selectedUser.email}</h4>
                  <p className="text-xs text-slate-500 capitalize">
                    {isOtherTyping ? (
                      <span className="text-blue-600 font-semibold animate-pulse">yozmoqda...</span>
                    ) : selectedUser.isOnline ? (
                      <span className="text-green-600 font-semibold">Onlayn</span>
                    ) : (
                      'Oflayn'
                    )}
                  </p>
                </div>
              </div>

              {/* HEADER MENYU (3 NUQTA) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                  className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {isHeaderMenuOpen && (
                  <div className="absolute right-0 top-11 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                    <button
                      type="button"
                      onClick={handleClearChat}
                      className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                    >
                      <Trash className="w-4 h-4 text-red-500" />
                      <span>Chatni tozalash</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Xabarlar ro'yxati */}
            <div className="flex-1 p-3 md:p-4 overflow-y-auto space-y-3">
              {messages.map((msg) => {
                const isMe = msg.senderId === user.uid;
                const isMenuOpen = activeMenuId === msg.id;

                return (
                  <div key={msg.id} className={`group flex items-end gap-1.5 relative ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    
                    <div className={`${isMenuOpen ? 'flex' : 'hidden md:group-hover:flex'} items-center gap-1 bg-white p-1 rounded-lg border shadow-md z-10 shrink-0`}>
                      <button
                        type="button"
                        onClick={() => { setReplyTo(msg); setEditingMessage(null); setActiveMenuId(null); }}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-blue-600"
                      >
                        <Reply className="w-4 h-4" />
                      </button>
                      {isMe && (
                        <>
                          {msg.text && (
                            <button
                              type="button"
                              onClick={() => startEdit(msg)}
                              className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-green-600"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveMenuId(isMenuOpen ? null : msg.id)}
                      className="md:hidden p-1 text-slate-400 hover:text-slate-600"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    <div className={`max-w-[82%] sm:max-w-[75%] p-3 rounded-2xl shadow-sm text-sm relative ${
                      isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                    }`}>
                      {msg.replyTo && (
                        <div className={`mb-2 p-2 rounded border-l-4 text-xs ${
                          isMe ? 'bg-blue-700/60 border-white text-blue-100' : 'bg-slate-100 border-blue-500 text-slate-600'
                        }`}>
                          <p className="truncate">{msg.replyTo.text}</p>
                        </div>
                      )}

                      {msg.image && (
                        <div className="mb-2 rounded-xl overflow-hidden border border-black/10">
                          <img 
                            src={msg.image} 
                            alt="Yuborilgan rasm" 
                            className="max-h-60 w-full object-cover cursor-pointer hover:opacity-90 transition"
                            onClick={() => window.open(msg.image, '_blank')}
                          />
                        </div>
                      )}

                      {msg.text && <p className="leading-relaxed break-words pr-2">{msg.text}</p>}

                      {msg.audio && (
                        <div className="mt-2 flex items-center gap-2">
                          <Volume2 className={`w-4 h-4 shrink-0 ${isMe ? 'text-blue-200' : 'text-blue-600'}`} />
                          <audio 
                            controls 
                            src={msg.audio} 
                            className="h-8 max-w-[200px] sm:max-w-[240px] outline-none" 
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] opacity-80">
                        {msg.createdAt && (
                          <span className={isMe ? 'text-blue-100' : 'text-slate-400'}>
                            {formatTime(msg.createdAt)}
                          </span>
                        )}

                        {msg.isEdited && (
                          <span className={`italic ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                            (tahrirlandi)
                          </span>
                        )}

                        {isMe && (
                          <span title={msg.isRead ? "O'qildi" : "Yuborildi"}>
                            {msg.isRead ? (
                              <CheckCheck className="w-3.5 h-3.5 text-sky-200 inline-block" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-blue-200 inline-block" />
                            )}
                          </span>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Forma */}
            <div className="p-2.5 md:p-3 bg-white border-t border-slate-200">
              {(replyTo || editingMessage) && (
                <div className="flex items-center justify-between mb-2 p-2 bg-slate-100 rounded-xl text-xs border-l-4 border-blue-600">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {replyTo ? <CornerDownRight className="w-4 h-4 text-blue-600 shrink-0" /> : <Edit2 className="w-4 h-4 text-green-600 shrink-0" />}
                    <div className="truncate">
                      <span className="font-semibold text-slate-700">{replyTo ? 'Javob:' : 'Tahrirlash:'}</span>
                      <p className="text-slate-500 truncate">
                        {replyTo ? (replyTo.text || (replyTo.image ? 'Rasm' : 'Ovozli xabar')) : editingMessage.text}
                      </p>
                    </div>
                  </div>
                  <button type="button" onClick={cancelAction} className="p-1 hover:bg-slate-200 rounded-full text-slate-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {imageBase64 && (
                <div className="flex items-center justify-between mb-2 p-2 bg-slate-100 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <img src={imageBase64} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-slate-300" />
                    <span className="text-xs text-slate-600 font-medium">Rasm biriktirildi</span>
                  </div>
                  <button type="button" onClick={() => setImageBase64(null)} className="p-1 hover:bg-slate-200 rounded-full text-slate-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 sm:gap-2">
                <input
                  type="file"
                  accept="image/*"
                  ref={imageInputRef}
                  onChange={handleImageSelect}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isRecording || Boolean(editingMessage)}
                  className="p-2 sm:p-2.5 rounded-full bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 transition shrink-0"
                  title="Rasm yuklash"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>

                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    disabled={Boolean(editingMessage)}
                    className="p-2 sm:p-2.5 rounded-full bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition shrink-0"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="p-2 sm:p-2.5 rounded-full bg-red-600 text-white animate-pulse shrink-0"
                  >
                    <Square className="w-5 h-5" />
                  </button>
                )}

                {audioBase64 ? (
                  <div className="flex-1 flex items-center gap-2 bg-slate-100 p-2 rounded-xl min-w-0">
                    <audio controls src={audioBase64} className="h-7 w-full max-w-[200px]" />
                    <button type="button" onClick={() => setAudioBase64(null)} className="text-xs text-red-500 font-bold ml-auto shrink-0 px-2">
                      O'chirish
                    </button>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={newMessage}
                    onChange={handleInputChange}
                    placeholder={editingMessage ? "Tahrirlang..." : (isRecording ? "Ovoz yozilmoqda..." : "Xabar...")}
                    disabled={isRecording}
                    className="flex-1 min-w-0 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}

                <button
                  type="submit"
                  className="p-2 sm:p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-md shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <User className="w-12 h-12 mb-2 text-slate-300" />
            <p className="text-sm">Xabar yozish uchun chap tarafdan xodimlardan birini tanlang.</p>
          </div>
        )}
      </div>

    </div>
  );
}