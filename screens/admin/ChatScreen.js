import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { auth, db } from '../../firebaseConfig';
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

import AdminTab from './AdminTab';

const COLORS = {
  primary: '#7B42F6',
  bg: '#F8F9FE',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  text1: '#1F2937',
  text2: '#6B7280',
  text3: '#9CA3AF',
  red: '#EF4444',
  accent: '#03A9F4',
  accentSoft: '#E1F5FE',
};

function ChatRoom({ convo, onBack }) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  const flatRef = useRef(null);

  useEffect(() => {
    const messagesRef = collection(db, 'chats', convo.id, 'messages');

    const unsubscribe = onSnapshot(
      messagesRef,
      (snapshot) => {
        const data = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }));

        data.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeA - timeB;
        });

        setMsgs(data);
        setLoading(false);

        setTimeout(() => {
          flatRef.current?.scrollToEnd({ animated: true });
        }, 100);
      },
      (error) => {
        console.log(error);
        Alert.alert('เกิดข้อผิดพลาด', 'โหลดข้อความไม่สำเร็จ');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [convo.id]);

  useEffect(() => {
    const markAsRead = async () => {
      try {
        await updateDoc(doc(db, 'chats', convo.id), {
          unreadAdmin: 0,
        });
      } catch (error) {
        console.log(error);
      }
    };

    markAsRead();
  }, [convo.id]);

  const send = async () => {
    const t = text.trim();

    if (!t) return;

    const currentUser = auth.currentUser;

    if (!currentUser) {
      Alert.alert('แจ้งเตือน', 'กรุณาเข้าสู่ระบบก่อนส่งข้อความ');
      return;
    }

    try {
      setText('');

      await addDoc(collection(db, 'chats', convo.id, 'messages'), {
        text: t,
        senderId: currentUser.uid,
        senderRole: 'admin',
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'chats', convo.id), {
        lastMsg: t,
        lastSenderRole: 'admin',
        lastTime: serverTimestamp(),
      });
    } catch (error) {
      console.log(error);
      Alert.alert('เกิดข้อผิดพลาด', 'ส่งข้อความไม่สำเร็จ');
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp?.seconds) return '';

    const date = new Date(timestamp.seconds * 1000);

    return date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={cr.header}>
          <TouchableOpacity onPress={onBack}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text1} />
          </TouchableOpacity>

          <View style={cr.avatar}>
            <Text style={cr.avatarTxt}>
              {(convo.userName || 'U').charAt(0)}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={cr.name}>
              {convo.userName || 'ไม่ระบุชื่อ'}
            </Text>
            <Text style={cr.sub}>
              {convo.userRole === 'employer' ? 'ผู้ประกอบการ' : 'นักศึกษา'}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={cr.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={cr.loadingText}>กำลังโหลดข้อความ...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatRef}
            data={msgs}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item: m }) => {
              const isMe = m.senderRole === 'admin';

              return (
                <View style={[cr.msgWrap, isMe && cr.msgWrapMe]}>
                  <View style={[cr.bubble, isMe ? cr.bubbleMe : cr.bubbleThem]}>
                    <Text style={[cr.msgTxt, isMe && cr.msgTxtMe]}>
                      {m.text}
                    </Text>
                  </View>

                  <Text style={cr.time}>{formatTime(m.createdAt)}</Text>
                </View>
              );
            }}
          />
        )}

        <View style={cr.inputBar}>
          <TextInput
            style={cr.input}
            value={text}
            onChangeText={setText}
            placeholder="พิมพ์ข้อความ..."
            multiline={true}
          />

          <TouchableOpacity
            style={[
              cr.sendBtn,
              { backgroundColor: text.trim() ? COLORS.primary : '#CCC' },
            ]}
            onPress={send}
            disabled={!text.trim()}
          >
            <Ionicons name="send" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

export default function AdminChatScreen({ setPage, activeTab }) {
  const [active, setActive] = useState(null);
  const [inbox, setInbox] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const chatsRef = collection(db, 'chats');

    const unsubscribe = onSnapshot(
      chatsRef,
      (snapshot) => {
        const data = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }));

        data.sort((a, b) => {
          const timeA = a.lastTime?.seconds || 0;
          const timeB = b.lastTime?.seconds || 0;
          return timeB - timeA;
        });

        setInbox(data);
        setLoading(false);
      },
      (error) => {
        console.log(error);
        Alert.alert('เกิดข้อผิดพลาด', 'โหลดแชทไม่สำเร็จ');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const formatTime = (timestamp) => {
    if (!timestamp?.seconds) return '';

    const date = new Date(timestamp.seconds * 1000);
    const now = new Date();

    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    if (diffDays === 1) return 'เมื่อวาน';

    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
    });
  };

  if (active) {
    return <ChatRoom convo={active} onBack={() => setActive(null)} />;
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <Text style={s.topTitle}>ข้อความ</Text>
      </View>

      {loading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={s.loadingText}>กำลังโหลดแชท...</Text>
        </View>
      ) : inbox.length === 0 ? (
        <View style={s.emptyBox}>
          <Ionicons name="chatbubbles-outline" size={55} color="#C4C4C4" />
          <Text style={s.emptyTitle}>ยังไม่มีข้อความ</Text>
          <Text style={s.emptyText}>
            เมื่อมีนักศึกษาหรือร้านค้าส่งข้อความหาแอดมิน แชทจะแสดงที่นี่
          </Text>
        </View>
      ) : (
        <FlatList
          data={inbox}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item: c }) => (
            <TouchableOpacity
              style={s.card}
              onPress={() => setActive(c)}
              activeOpacity={0.7}
            >
              <View style={s.avatar}>
                <Text style={s.avatarTxt}>
                  {(c.userName || 'U').charAt(0)}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <View style={s.rowBetween}>
                  <Text style={s.name}>
                    {c.userName || 'ไม่ระบุชื่อ'}
                  </Text>

                  <Text style={s.timeText}>
                    {formatTime(c.lastTime)}
                  </Text>
                </View>

                <Text style={s.lastMsg} numberOfLines={1}>
                  {c.lastMsg || 'ยังไม่มีข้อความ'}
                </Text>
              </View>

              {c.unreadAdmin > 0 && (
                <View style={s.unreadBadge}>
                  <Text style={s.unreadTxt}>{c.unreadAdmin}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}

      <AdminTab activeTab={activeTab || 'admin-chat'} setPage={setPage} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  topBar: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  topTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 10,
    color: COLORS.text2,
  },

  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.text1,
    marginTop: 15,
  },

  emptyText: {
    fontSize: 13,
    color: COLORS.text3,
    textAlign: 'center',
    marginTop: 8,
  },

  card: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    marginBottom: 1,
    alignItems: 'center',
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },

  avatarTxt: {
    fontWeight: 'bold',
    fontSize: 18,
    color: COLORS.primary,
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  name: {
    fontWeight: 'bold',
    color: COLORS.text1,
    fontSize: 14,
  },

  timeText: {
    fontSize: 10,
    color: COLORS.text3,
  },

  lastMsg: {
    color: COLORS.text3,
    fontSize: 12,
    marginTop: 4,
  },

  unreadBadge: {
    backgroundColor: COLORS.red,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 10,
  },

  unreadTxt: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

const cr = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },

  avatarTxt: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },

  name: {
    fontWeight: 'bold',
    fontSize: 14,
  },

  sub: {
    fontSize: 10,
    color: COLORS.text3,
  },

  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 10,
    color: COLORS.text2,
  },

  msgWrap: {
    marginBottom: 10,
    alignItems: 'flex-start',
  },

  msgWrapMe: {
    alignItems: 'flex-end',
  },

  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 15,
  },

  bubbleThem: {
    backgroundColor: 'white',
  },

  bubbleMe: {
    backgroundColor: COLORS.primary,
  },

  msgTxt: {
    fontSize: 14,
    color: COLORS.text1,
    lineHeight: 20,
  },

  msgTxtMe: {
    color: 'white',
  },

  time: {
    fontSize: 9,
    color: COLORS.text3,
    marginTop: 2,
  },

  inputBar: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'white',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  input: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 14,
  },

  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});