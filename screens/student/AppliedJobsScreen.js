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
  onSnapshot
} from 'firebase/firestore';

export default function AppliedJobsScreen({ setPage, setIsLoggedIn }) {
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      Alert.alert('แจ้งเตือน', 'กรุณาเข้าสู่ระบบก่อนใช้งาน');
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'applications'),
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
          const timeA = a.appliedAt?.seconds || 0;
          const timeB = b.appliedAt?.seconds || 0;
          return timeB - timeA;
        });

        setAppliedJobs(data);
        setLoading(false);
      },
      (error) => {
        console.log(error);
        Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดงานที่สมัครได้');
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

  const formatDate = (timestamp) => {
    if (!timestamp?.seconds) return '-';

    const date = new Date(timestamp.seconds * 1000);

    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusText = (status) => {
    if (status === 'accepted') return 'ผ่าน';
    if (status === 'rejected') return 'ไม่ผ่าน';
    return 'รอพิจารณา';
  };

  const getStatusColor = (status) => {
    if (status === 'accepted') return '#4CAF50';
    if (status === 'rejected') return '#F44336';
    return '#FFC107';
  };

  const getStatusBgColor = (status) => {
    if (status === 'accepted') return '#E8F5E9';
    if (status === 'rejected') return '#FFEBEE';
    return '#FFF9E6';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brandName}>UinJob Connect</Text>

      </View>

      <View style={styles.content}>
        <Text style={styles.title}>งานที่สมัคร</Text>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.columnHeader, { flex: 2 }]}>ชื่อหน่วยงาน</Text>
          <Text style={[styles.columnHeader, { flex: 1.5, textAlign: 'center' }]}>
            วันที่สมัคร
          </Text>
          <Text style={[styles.columnHeader, { flex: 1, textAlign: 'right' }]}>
            สถานะ
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#7B42F6" />
            <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
          </View>
        ) : appliedJobs.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="briefcase-outline" size={50} color="#C4C4C4" />
            <Text style={styles.emptyTitle}>ยังไม่มีงานที่สมัคร</Text>
            <Text style={styles.emptyText}>
              เมื่อคุณสมัครงาน รายการงานจะแสดงที่หน้านี้
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {appliedJobs.map((item) => {
              const statusColor = getStatusColor(item.status);
              const bgColor = getStatusBgColor(item.status);

              return (
                <View key={item.id} style={styles.jobRow}>
                  <View style={{ flex: 2 }}>
                    <Text style={styles.jobTitle}>
                      {item.jobTitle || 'ไม่ระบุชื่องาน'}
                    </Text>
                    <Text style={styles.companyName}>
                      {item.companyName || item.businessName || 'ไม่ระบุร้านค้า'}
                    </Text>
                  </View>

                  <Text style={styles.dateText}>
                    {formatDate(item.appliedAt)}
                  </Text>

                  <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
                    <View style={[styles.dot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {getStatusText(item.status)}
                    </Text>
                  </View>
                </View>
              );
            })}

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
          <Ionicons name="briefcase" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setPage('saved')}>
          <Ionicons name="bookmark-outline" size={24} color="#C4C4C4" />
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

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#E0E0E0',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginBottom: 10
  },

  columnHeader: {
    fontSize: 12,
    color: '#333',
    fontWeight: 'bold'
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

  jobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5
  },

  jobTitle: {
    fontSize: 13,
    fontWeight: 'bold'
  },

  companyName: {
    fontSize: 11,
    color: '#999',
    marginTop: 2
  },

  dateText: {
    flex: 1.5,
    fontSize: 11,
    color: '#666',
    textAlign: 'center'
  },

  statusBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 80
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5
  },

  statusText: {
    fontSize: 10,
    fontWeight: 'bold'
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
    alignItems: 'center',
  },

  tabItem: {
    alignItems: 'center',
    justifyContent: 'center'
  }
});