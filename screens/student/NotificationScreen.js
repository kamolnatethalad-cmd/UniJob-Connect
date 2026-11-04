import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Firebase
import { auth, db } from '../../firebaseConfig';
import { signOut } from 'firebase/auth';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc
} from 'firebase/firestore';

export default function NotificationScreen({ setPage, setIsLoggedIn }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      Alert.alert('แจ้งเตือน', 'กรุณาเข้าสู่ระบบก่อนใช้งาน');
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data()
        }));

        data.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });

        setNotifications(data);
        setLoading(false);
      },
      (error) => {
        console.log(error);
        Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดการแจ้งเตือนได้');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);

      if (setIsLoggedIn) {
        setIsLoggedIn();
      }
    } catch (error) {
      console.log(error);
      Alert.alert('เกิดข้อผิดพลาด', 'ออกจากระบบไม่สำเร็จ');
    }
  };

  const handleReadNotification = async (item) => {
  try {
    await updateDoc(doc(db, 'notifications', item.id), {
      isRead: true
    });

    Alert.alert(
      'รายละเอียดงาน',
      `${item.message}

ตำแหน่งงาน: ${item.jobTitle || '-'}
บริษัท: ${item.companyName || '-'}
สถานที่: ${item.location || '-'}

ประเภทงาน: ${item.jobType || '-'}
ค่าตอบแทน: ${item.salary || '-'}

ติดต่อกลับ:
เบอร์โทร: ${item.phone || '-'}
อีเมล: ${item.email || '-'}
สถานะ: ${
        item.type === 'accepted'
          ? 'ผ่านการคัดเลือก'
          : item.type === 'rejected'
          ? 'ไม่ผ่านการคัดเลือก'
          : '-'
      }`
    );
  } catch (error) {
    console.log(error);
  }
};

  const formatTimeAgo = (timestamp) => {
    if (!timestamp?.seconds) return 'ไม่ทราบเวลา';

    const createdDate = new Date(timestamp.seconds * 1000);
    const now = new Date();

    const diffMs = now - createdDate;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'เมื่อสักครู่';
    if (diffMinutes < 60) return `${diffMinutes} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    if (diffDays === 1) return '1 วันที่แล้ว';
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`;

    const date = createdDate.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    return date;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brandName}>UinJob Connect</Text>

       
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>การแจ้งเตือน</Text>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#7B42F6" />
            <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="notifications-outline" size={55} color="#C4C4C4" />
            <Text style={styles.emptyTitle}>ยังไม่มีการแจ้งเตือน</Text>
            <Text style={styles.emptyText}>
              เมื่อมีการตอบรับงานหรือข่าวสารใหม่ การแจ้งเตือนจะแสดงที่นี่
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {notifications.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.notifCard,
                  !item.isRead && styles.unreadCard
                ]}
               onPress={() => handleReadNotification(item)}
              >
                <View style={styles.iconBox}>
                  <Ionicons
                    name={item.type === 'accepted' ? 'checkmark-circle' : item.type === 'rejected' ? 'close-circle' : 'notifications'}
                    size={24}
                    color={
                      item.type === 'accepted'
                        ? '#4CAF50'
                        : item.type === 'rejected'
                        ? '#F44336'
                        : '#7B42F6'
                    }
                  />
                </View>

                <View style={styles.cardContent}>
                  <Text style={styles.notifMessage}>
                    {item.message || 'ไม่มีข้อความแจ้งเตือน'}
                  </Text>

                  <Text style={styles.notifTime}>
                    {formatTimeAgo(item.createdAt)}
                  </Text>
                </View>

                {!item.isRead && <View style={styles.newDot} />}
              </TouchableOpacity>
            ))}

            <View style={{ height: 100 }} />
          </ScrollView>
        )}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.bottomTab}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setPage('home')}>
          <Ionicons name="home-outline" size={24} color="#C4C4C4" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setPage('applied')}>
          <Ionicons name="briefcase-outline" size={24} color="#C4C4C4" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setPage('saved')}>
          <Ionicons name="bookmark-outline" size={24} color="#C4C4C4" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setPage('notif')}>
          <Ionicons name="notifications" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setPage('profile')}>
          <Ionicons name="person-outline" size={24} color="#C4C4C4" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FE'
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    paddingTop: 40,
  },

  brandName: {
    fontSize: 18,
    fontWeight: 'bold'
  },

  btnNotify: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD'
  },

  btnNotifyText: {
    fontSize: 11,
    color: '#666'
  },

  content: {
    flex: 1,
    padding: 20
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20
  },

  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },

  loadingText: {
    marginTop: 10,
    color: '#666'
  },

  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15
  },

  emptyText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginTop: 8
  },

  notifCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },

  unreadCard: {
    borderColor: '#7B42F6',
    backgroundColor: '#FBFAFF'
  },

  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F2F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },

  cardContent: {
    flex: 1
  },

  notifMessage: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    lineHeight: 20
  },

  notifTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 8
  },

  newDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7B42F6',
    marginLeft: 10
  },

  bottomTab: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#7B42F6',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center'
  },

  tabItem: {
    alignItems: 'center',
    justifyContent: 'center'
  }
});