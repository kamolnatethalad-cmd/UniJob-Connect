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

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Firebase
import { auth, db } from '../../firebaseConfig';
import { signOut } from 'firebase/auth';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';

export default function ApplicantsScreen({ setPage, setIsLoggedIn }) {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลผู้สมัครของร้านค้านี้
  useEffect(() => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setLoading(false);
      Alert.alert('แจ้งเตือน', 'กรุณาเข้าสู่ระบบก่อนดูผู้สมัคร');
      return;
    }

    const q = query(
      collection(db, 'applications'),
      where('employerId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data()
        }));

        // เรียงล่าสุดไว้บนสุด ถ้ามี appliedAt
        data.sort((a, b) => {
          const timeA = a.appliedAt?.seconds || 0;
          const timeB = b.appliedAt?.seconds || 0;
          return timeB - timeA;
        });

        setApplicants(data);
        setLoading(false);
      },
      (error) => {
        console.log(error);
        Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลผู้สมัครได้');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (applicationId, newStatus) => {
    try {
      await updateDoc(doc(db, 'applications', applicationId), {
        status: newStatus
      });

      const selectedApplicant = applicants.find(
  (item) => item.id === applicationId
);

await addDoc(collection(db, 'notifications'), {
  userId: selectedApplicant.studentId,

  type: newStatus,

  message:
    newStatus === 'accepted'
      ? `คุณผ่านการคัดเลือกตำแหน่ง ${selectedApplicant.jobTitle}`
      : `คุณไม่ผ่านการคัดเลือกตำแหน่ง ${selectedApplicant.jobTitle}`,
      jobTitle: selectedApplicant.jobTitle || '',
companyName: selectedApplicant.companyName || '',

phone: selectedApplicant.phone || '',
email: selectedApplicant.email || '',

location: selectedApplicant.location || '',
salary: selectedApplicant.salary || '',
jobType: selectedApplicant.jobType || '',

  isRead: false,

  createdAt: serverTimestamp()
});
      if (newStatus === 'accepted') {
        Alert.alert('สำเร็จ', 'ตอบรับผู้สมัครเรียบร้อยแล้ว');
      } else {
        Alert.alert('สำเร็จ', 'ปฏิเสธผู้สมัครเรียบร้อยแล้ว');
      }
    } catch (error) {
      console.log(error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถอัปเดตสถานะได้');
    }
  };

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
    if (status === 'accepted') return 'ตอบรับแล้ว';
    if (status === 'rejected') return 'ปฏิเสธแล้ว';
    return 'รอพิจารณา';
  };

  const getStatusColor = (status) => {
    if (status === 'accepted') return '#4CAF50';
    if (status === 'rejected') return '#F44336';
    return '#FF9800';
  };

  const getInitial = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brandName}>UinJob Connect</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.employerInfo}>
          <View style={styles.employerLogo}>
            <Text style={styles.logoText}>IE</Text>
          </View>

          <View>
            <Text style={styles.employerName}>ผู้ประกอบการ</Text>
            <Text style={styles.companySub}>รายการผู้สมัครงาน</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>ผู้สมัครงานทั้งหมด</Text>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#7B42F6" />
            <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
          </View>
        ) : applicants.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="people-outline" size={50} color="#C4C4C4" />
            <Text style={styles.emptyTitle}>ยังไม่มีผู้สมัครงาน</Text>
            <Text style={styles.emptyText}>
              เมื่อมีนักศึกษาสมัครงาน รายชื่อจะแสดงที่หน้านี้
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {applicants.map((item) => (
              <View key={item.id} style={styles.applicantCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {getInitial(item.studentName)}
                    </Text>
                  </View>

                  <View style={styles.infoGroup}>
                    <Text style={styles.nameText}>
                      {item.studentName || 'ไม่ระบุชื่อ'}
                    </Text>

                    <Text style={styles.majorText}>
                      {item.major || 'ไม่ระบุสาขา'}
                    </Text>

                    {item.jobTitle ? (
                      <Text style={styles.jobText}>
                        สมัครงาน: {item.jobTitle}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.contactRow}>
                  <Ionicons name="call-outline" size={14} color="#666" />
                  <Text style={styles.contactText}>
                    {item.phone || '-'}
                  </Text>
                </View>

                <View style={styles.contactRow}>
                  <Ionicons name="mail-outline" size={14} color="#666" />
                  <Text style={styles.contactText}>
                    {item.email || '-'}
                  </Text>
                </View>

                <View style={styles.statusRow}>
                  <Text style={styles.dateText}>
                    สมัครเมื่อ : {formatDate(item.appliedAt)}
                  </Text>

                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(item.status) }
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>
                      {getStatusText(item.status)}
                    </Text>
                  </View>
                </View>

                {item.status === 'pending' || !item.status ? (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.statusBtn, { backgroundColor: '#4CAF50' }]}
                      onPress={() => handleUpdateStatus(item.id, 'accepted')}
                    >
                      <Text style={styles.btnText}>ตอบรับ</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.statusBtn, { backgroundColor: '#F44336' }]}
                      onPress={() => handleUpdateStatus(item.id, 'rejected')}
                    >
                      <Text style={styles.btnText}>ปฏิเสธ</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            ))}

            <View style={{ height: 100 }} />
          </ScrollView>
        )}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.bottomTab}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setPage('employer-home')}
        >
          <Ionicons name="home-outline" size={24} color="#C4C4C4" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setPage('manage-jobs')}
        >
          <MaterialCommunityIcons
            name="briefcase-variant-outline"
            size={24}
            color="#C4C4C4"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setPage('applicants')}
        >
          <Ionicons name="people" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setPage('employer-profile')}
        >
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
    padding: 20,
    backgroundColor: 'white',
    paddingTop: 40,
  },

  brandName: {
    fontSize: 18,
    fontWeight: 'bold'
  },

  btnLogOut: {
    padding: 6,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8
  },

  btnLogOutText: {
    fontSize: 10,
    color: '#666'
  },

  content: {
    flex: 1,
    padding: 20
  },

  employerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },

  employerLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#00A651',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },

  logoText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18
  },

  employerName: {
    fontSize: 16,
    fontWeight: 'bold'
  },

  companySub: {
    fontSize: 12,
    color: '#666'
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15
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
    fontSize: 18,
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

  applicantCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 2
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#7B42F6',
    justifyContent: 'center',
    alignItems: 'center'
  },

  avatarText: {
    color: 'white',
    fontWeight: 'bold'
  },

  infoGroup: {
    flex: 1,
    marginLeft: 12
  },

  nameText: {
    fontSize: 14,
    fontWeight: 'bold'
  },

  majorText: {
    fontSize: 11,
    color: '#999',
    marginTop: 2
  },

  jobText: {
    fontSize: 11,
    color: '#7B42F6',
    marginTop: 4
  },

  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5
  },

  contactText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8
  },

  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12
  },

  dateText: {
    fontSize: 10,
    color: '#BBB'
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20
  },

  statusBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold'
  },

  actionButtons: {
    flexDirection: 'row',
    marginTop: 12
  },

  statusBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center'
  },

  btnText: {
    color: 'white',
    fontSize: 12,
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
    alignItems: 'center'
  },

  tabItem: {
    alignItems: 'center',
    justifyContent: 'center'
  }
});