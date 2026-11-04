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
  deleteDoc
} from 'firebase/firestore';

export default function ManageJobsScreen({ setPage, setIsLoggedIn }) {
  const [myJobs, setMyJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      Alert.alert('แจ้งเตือน', 'กรุณาเข้าสู่ระบบก่อนใช้งาน');
      setLoading(false);
      return;
    }

    const jobsQuery = query(
      collection(db, 'jobs'),
      where('employerId', '==', currentUser.uid)
    );

    const appsQuery = query(
      collection(db, 'applications'),
      where('employerId', '==', currentUser.uid)
    );

    const unsubscribeJobs = onSnapshot(
      jobsQuery,
      (snapshot) => {
        const jobsData = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data()
        }));

        jobsData.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });

        setMyJobs(jobsData);
        setLoading(false);
      },
      (error) => {
        console.log(error);
        Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดประกาศงานได้');
        setLoading(false);
      }
    );

    const unsubscribeApps = onSnapshot(
      appsQuery,
      (snapshot) => {
        const appsData = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data()
        }));

        setApplications(appsData);
      },
      (error) => {
        console.log(error);
      }
    );

    return () => {
      unsubscribeJobs();
      unsubscribeApps();
    };
  }, []);

  const getApplicantsCount = (jobId) => {
    return applications.filter((item) => item.jobId === jobId).length;
  };

  const formatDateAgo = (timestamp) => {
    if (!timestamp?.seconds) return 'ไม่ทราบเวลา';

    const createdDate = new Date(timestamp.seconds * 1000);
    const now = new Date();
    const diffMs = now - createdDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'วันนี้';
    if (diffDays === 1) return '1 วันที่แล้ว';
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`;

    const diffWeeks = Math.floor(diffDays / 7);
    return `${diffWeeks} สัปดาห์ที่แล้ว`;
  };

  const getStatusText = (status) => {
    if (status === 'approved') return 'เปิดรับ';
    if (status === 'rejected') return 'ไม่อนุมัติ';
    if (status === 'closed') return 'ปิดรับ';
    return 'รออนุมัติ';
  };

  const getStatusColor = (status) => {
    if (status === 'approved') return '#4CAF50';
    if (status === 'rejected') return '#F44336';
    if (status === 'closed') return '#999';
    return '#FF9800';
  };

  const handleDeleteJob = (jobId) => {
    Alert.alert(
      'ยืนยันการลบ',
      'คุณต้องการลบประกาศงานนี้หรือไม่?',
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
              await deleteDoc(doc(db, 'jobs', jobId));
              Alert.alert('สำเร็จ', 'ลบประกาศงานเรียบร้อยแล้ว');
            } catch (error) {
              console.log(error);
              Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถลบประกาศงานได้');
            }
          }
        }
      ]
    );
  };

  const handleViewJob = (job) => {
    Alert.alert(
      job.jobTitle || 'รายละเอียดงาน',
      `ประเภทงาน: ${job.jobType || '-'}\nจำนวนที่รับ: ${job.quantity || '-'} คน\nค่าตอบแทน: ${job.salary || '-'}\nสถานที่: ${job.location || '-'}\n\nรายละเอียดงาน:\n${job.description || '-'}\n\nคุณสมบัติ:\n${job.requirements || '-'}`
    );
  };

  const handleEditJob = () => {
    Alert.alert('แจ้งเตือน', 'ยังไม่ได้ทำหน้าแก้ไขประกาศงาน');
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brandName}>UinJob Connect</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>ประกาศงานของฉัน</Text>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setPage('add-job')}
          >
            <Ionicons name="add" size={16} color="white" />
            <Text style={styles.addBtnText}>เพิ่มงาน</Text>
          </TouchableOpacity>
        </View>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.colHeader, { flex: 2 }]}>ตำแหน่งงาน</Text>
          <Text style={[styles.colHeader, { flex: 1, textAlign: 'center' }]}>
            ผู้สมัคร
          </Text>
          <Text style={[styles.colHeader, { flex: 1, textAlign: 'center' }]}>
            สถานะ
          </Text>
          <Text style={[styles.colHeader, { flex: 1.5, textAlign: 'right' }]}>
            จัดการ
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#7B42F6" />
            <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
          </View>
        ) : myJobs.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="briefcase-outline" size={50} color="#C4C4C4" />
            <Text style={styles.emptyTitle}>ยังไม่มีประกาศงาน</Text>
            <Text style={styles.emptyText}>
              กดปุ่มเพิ่มงานเพื่อเริ่มลงประกาศงานแรกของร้านคุณ
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {myJobs.map((item) => {
              const statusColor = getStatusColor(item.status);

              return (
                <View key={item.id} style={styles.jobRow}>
                  <View style={{ flex: 2 }}>
                    <Text style={styles.jobTitleText}>
                      {item.jobTitle || 'ไม่ระบุชื่องาน'}
                    </Text>
                    <Text style={styles.timeAgoText}>
                      {formatDateAgo(item.createdAt)}
                    </Text>
                  </View>

                  <Text style={[styles.cellText, { flex: 1, textAlign: 'center' }]}>
                    {getApplicantsCount(item.id)}
                  </Text>

                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <View style={[styles.statusTag, { borderColor: statusColor }]}>
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {getStatusText(item.status)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.actionGroup}>
                    <TouchableOpacity onPress={() => handleViewJob(item)}>
                      <Ionicons name="eye-outline" size={18} color="#7B42F6" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleEditJob}>
                      <Ionicons name="create-outline" size={18} color="#4CAF50" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => handleDeleteJob(item.id)}>
                      <Ionicons name="trash-outline" size={18} color="#F44336" />
                    </TouchableOpacity>
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
            name="briefcase-variant"
            size={24}
            color="white"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setPage('applicants')}
        >
          <Ionicons name="people-outline" size={24} color="#C4C4C4" />
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

  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold'
  },

  addBtn: {
    backgroundColor: '#7B42F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10
  },

  addBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4
  },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 1
  },

  colHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333'
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
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    elevation: 2
  },

  jobTitleText: {
    fontSize: 13,
    fontWeight: 'bold'
  },

  timeAgoText: {
    fontSize: 10,
    color: '#BBB',
    marginTop: 3
  },

  cellText: {
    fontSize: 12,
    color: '#333'
  },

  statusTag: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5
  },

  statusText: {
    fontSize: 10,
    fontWeight: 'bold'
  },

  actionGroup: {
    flex: 1.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
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