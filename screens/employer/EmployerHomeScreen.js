import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Firebase
import { auth, db } from '../../firebaseConfig';
import { signOut } from 'firebase/auth';
import {
  collection,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';

export default function EmployerHomeScreen({ setPage, setIsLoggedIn }) {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setLoading(false);
      Alert.alert('แจ้งเตือน', 'กรุณาเข้าสู่ระบบก่อนใช้งาน');
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
        const jobData = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data()
        }));

        jobData.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });

        setJobs(jobData);
        setLoading(false);
      },
      (error) => {
        console.log(error);
        Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลงานได้');
        setLoading(false);
      }
    );

    const unsubscribeApps = onSnapshot(
      appsQuery,
      (snapshot) => {
        const appData = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data()
        }));

        setApplications(appData);
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

  const getApplicantsCountByJob = (jobId) => {
    return applications.filter((item) => item.jobId === jobId).length;
  };

  const acceptedCount = applications.filter(
    (item) => item.status === 'accepted'
  ).length;

  const latestJobs = jobs.slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brandName}>UinJob Connect</Text>

        <View style={styles.headerRight}>
          <Ionicons name="notifications-outline" size={20} color="#333" />

      
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.addJobBtn}
          onPress={() => setPage('add-job')}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addJobText}>ประกาศงานใหม่</Text>
        </TouchableOpacity>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#7B42F6" />
            <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
          </View>
        ) : (
          <>
            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{jobs.length}</Text>
                <Text style={styles.statLabel}>งานที่ประกาศ</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{applications.length}</Text>
                <Text style={styles.statLabel}>ผู้สมัครทั้งหมด</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{acceptedCount}</Text>
                <Text style={styles.statLabel}>รับเข้าทำงาน</Text>
              </View>
            </View>

            {/* ประกาศล่าสุด */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>ประกาศล่าสุด</Text>

              <TouchableOpacity onPress={() => setPage('manage-jobs')}>
                <Text style={styles.seeAllText}>ดูทั้งหมด</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.jobListCard}>
              {latestJobs.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="briefcase-outline" size={40} color="#C4C4C4" />
                  <Text style={styles.emptyTitle}>ยังไม่มีประกาศงาน</Text>
                  <Text style={styles.emptyText}>
                    กดปุ่มประกาศงานใหม่เพื่อเริ่มลงงานแรก
                  </Text>
                </View>
              ) : (
                latestJobs.map((job) => (
                  <View key={job.id} style={styles.jobItem}>
                    <View style={styles.jobHeaderRow}>
                      <Text style={styles.jobTitle}>
                        {job.jobTitle || 'ไม่ระบุชื่องาน'}
                      </Text>

                      <Text style={styles.statusText}>
                        {job.status === 'approved'
                          ? 'อนุมัติแล้ว'
                          : job.status === 'rejected'
                          ? 'ไม่อนุมัติ'
                          : 'รออนุมัติ'}
                      </Text>
                    </View>

                    <Text style={styles.jobDetail}>
                      {getApplicantsCountByJob(job.id)} ผู้สมัคร - {formatDateAgo(job.createdAt)}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Tab Bar สำหรับผู้ประกอบการ */}
      <View style={styles.bottomTab}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setPage('employer-home')}
        >
          <Ionicons name="home" size={24} color="white" />
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    elevation: 2,
    paddingTop: 40,
  },

  brandName: {
    fontSize: 18,
    fontWeight: 'bold'
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  btnLogOut: {
    marginLeft: 15,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8
  },

  btnLogOutText: {
    fontSize: 10,
    color: '#666'
  },

  scrollContent: {
    padding: 20
  },

  addJobBtn: {
    backgroundColor: '#7B42F6',
    flexDirection: 'row',
    alignSelf: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 25,
    elevation: 3
  },

  addJobText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 13
  },

  loadingBox: {
    marginTop: 80,
    alignItems: 'center'
  },

  loadingText: {
    marginTop: 10,
    color: '#666'
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25
  },

  statCard: {
    backgroundColor: 'white',
    width: '31%',
    padding: 15,
    borderRadius: 18,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5
  },

  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333'
  },

  statLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 5,
    textAlign: 'center'
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },

  seeAllText: {
    fontSize: 12,
    color: '#7B42F6',
    fontWeight: '600'
  },

  jobListCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10
  },

  jobItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingVertical: 15
  },

  jobHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  jobTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8
  },

  jobDetail: {
    fontSize: 11,
    color: '#999',
    marginTop: 5
  },

  statusText: {
    fontSize: 10,
    color: '#7B42F6',
    fontWeight: 'bold'
  },

  emptyBox: {
    alignItems: 'center',
    paddingVertical: 30
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10
  },

  emptyText: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    textAlign: 'center'
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