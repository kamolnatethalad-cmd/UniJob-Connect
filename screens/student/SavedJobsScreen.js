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
  deleteDoc
} from 'firebase/firestore';

export default function SavedJobsScreen({ setPage, setIsLoggedIn }) {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      Alert.alert('แจ้งเตือน', 'กรุณาเข้าสู่ระบบก่อนใช้งาน');
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'savedJobs'),
      where('studentId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data()
        }));

        data.sort((a, b) => {
          const timeA = a.savedAt?.seconds || 0;
          const timeB = b.savedAt?.seconds || 0;
          return timeB - timeA;
        });

        setSavedJobs(data);
        setLoading(false);
      },
      (error) => {
        console.log(error);
        Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดงานที่บันทึกไว้ได้');
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

  const handleRemoveSavedJob = (savedJobId) => {
    Alert.alert(
      'ยืนยันการลบ',
      'ต้องการลบงานนี้ออกจากรายการบันทึกหรือไม่?',
      [
        {
          text: 'ยกเลิก',
          style: 'cancel'
        },
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'savedJobs', savedJobId));
              Alert.alert('สำเร็จ', 'ลบงานที่บันทึกไว้เรียบร้อยแล้ว');
            } catch (error) {
              console.log(error);
              Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถลบงานที่บันทึกได้');
            }
          }
        }
      ]
    );
  };

  const formatDateAgo = (timestamp) => {
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

    const diffWeeks = Math.floor(diffDays / 7);
    return `${diffWeeks} สัปดาห์ที่แล้ว`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brandName}>UinJob Connect</Text>

      </View>

      <View style={styles.content}>
        <Text style={styles.title}>งานที่บันทึกไว้</Text>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#7B42F6" />
            <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
          </View>
        ) : savedJobs.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="bookmark-outline" size={55} color="#C4C4C4" />
            <Text style={styles.emptyTitle}>ยังไม่มีงานที่บันทึกไว้</Text>
            <Text style={styles.emptyText}>
              เมื่อคุณกดบันทึกงาน รายการงานจะแสดงที่หน้านี้
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {savedJobs.map((job) => (
              <View key={job.id} style={styles.jobCard}>
                <View style={styles.cardTop}>
                  <View style={styles.logoBox}>
                    <Text style={styles.logoText}>
                      {(job.companyName || job.businessName || 'U').charAt(0)}
                    </Text>
                  </View>

                  <View style={styles.titleInfo}>
                    <Text style={styles.jobTitle}>
                      {job.jobTitle || 'ไม่ระบุชื่องาน'}
                    </Text>

                    <Text style={styles.companyName}>
                      {job.companyName || job.businessName || 'ไม่ระบุร้านค้า'}
                    </Text>
                  </View>

                  <TouchableOpacity onPress={() => handleRemoveSavedJob(job.id)}>
                    <Ionicons name="bookmark" size={22} color="#7B42F6" />
                  </TouchableOpacity>
                </View>

                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={14} color="#666" />
                  <Text style={styles.locationText}>
                    {job.location || 'ไม่ระบุสถานที่'}
                  </Text>
                </View>

                <View style={styles.badgeRow}>
                  <View style={[styles.badge, styles.salaryBadge]}>
                    <Text style={styles.salaryText}>
                      {job.salary || 'ไม่ระบุค่าตอบแทน'}
                    </Text>
                  </View>

                  <View style={[styles.badge, styles.typeBadge]}>
                    <Text style={styles.typeText}>
                      {job.jobType || 'Part-time'}
                    </Text>
                  </View>

                  <View style={[styles.badge, styles.urgentBadge]}>
                    <Text style={styles.urgentText}>
                      รับ {job.quantity || '-'} คน
                    </Text>
                  </View>
                </View>

                <Text style={styles.timeText}>
                  <Ionicons name="time-outline" size={12} /> บันทึกเมื่อ {formatDateAgo(job.savedAt)}
                </Text>
              </View>
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
          <Ionicons name="bookmark" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setPage('notif')}>
          <Ionicons name="notifications-outline" size={24} color="#C4C4C4" />
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

  jobCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  logoBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFE5B4'
  },

  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF9800'
  },

  titleInfo: {
    flex: 1,
    marginLeft: 15
  },

  jobTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333'
  },

  companyName: {
    fontSize: 12,
    color: '#999',
    marginTop: 2
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12
  },

  locationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4
  },

  badgeRow: {
    flexDirection: 'row',
    marginTop: 12,
    flexWrap: 'wrap'
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 6
  },

  salaryBadge: {
    backgroundColor: '#FFF4E5'
  },

  salaryText: {
    color: '#FF9800',
    fontSize: 11,
    fontWeight: 'bold'
  },

  typeBadge: {
    backgroundColor: '#EFEAFF'
  },

  typeText: {
    color: '#7B42F6',
    fontSize: 11,
    fontWeight: 'bold'
  },

  urgentBadge: {
    backgroundColor: '#F3F4F6'
  },

  urgentText: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: 'bold'
  },

  timeText: {
    fontSize: 11,
    color: '#999',
    marginTop: 12
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