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
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

// Firebase
import { auth, db } from '../../firebaseConfig';
import { signOut } from 'firebase/auth';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  getDocs,
  doc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';

export default function DashboardScreen({ setPage, setIsLoggedIn }) {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [studentProfile, setStudentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applyingJobId, setApplyingJobId] = useState(null);

  
  useEffect(() => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      Alert.alert('แจ้งเตือน', 'กรุณาเข้าสู่ระบบก่อนใช้งาน');
      setLoading(false);
      return;
    }

    const fetchStudentProfile = async () => {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setStudentProfile(userSnap.data());
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchStudentProfile();

    // ดึงเฉพาะงานที่ผ่านการอนุมัติแล้ว
    const jobsQuery = query(
      collection(db, 'jobs'),
      where('status', '==', 'approved')
    );

    const savedJobsQuery = query(
  collection(db, 'savedJobs'),
  where('studentId', '==', currentUser.uid)
);
    const applicationsQuery = query(
      collection(db, 'applications'),
      where('studentId', '==', currentUser.uid)
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

    const unsubscribeApplications = onSnapshot(
      applicationsQuery,
      (snapshot) => {
        const appData = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data()
        }));

        appData.sort((a, b) => {
          const timeA = a.appliedAt?.seconds || 0;
          const timeB = b.appliedAt?.seconds || 0;
          return timeB - timeA;
        });

        setApplications(appData);
      },
      (error) => {
        console.log(error);
      }
    );

    const unsubscribeSavedJobs = onSnapshot(
  savedJobsQuery,
  (snapshot) => {
    const data = snapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data()
    }));

    setSavedJobs(data);
  }
);

    return () => {
      unsubscribeJobs();
      unsubscribeApplications();
      unsubscribeSavedJobs();
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

  const hasApplied = (jobId) => {
    return applications.some((item) => item.jobId === jobId);
  };
const isSaved = (jobId) => {
  return savedJobs.some((item) => item.jobId === jobId);
};
  const handleApplyJob = async (job) => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      Alert.alert('แจ้งเตือน', 'กรุณาเข้าสู่ระบบก่อนสมัครงาน');
      return;
    }

    if (hasApplied(job.id)) {
      Alert.alert('แจ้งเตือน', 'คุณสมัครงานนี้ไปแล้ว');
      return;
    }

    try {
      setApplyingJobId(job.id);

      const fullName = `${studentProfile?.firstName || ''} ${studentProfile?.lastName || ''}`.trim();

      await addDoc(collection(db, 'applications'), {
        jobId: job.id,
        employerId: job.employerId,
        studentId: currentUser.uid,

        studentName: fullName || 'ไม่ระบุชื่อ',
        major: studentProfile?.major || '',
        phone: studentProfile?.phone || '',
        email: studentProfile?.email || currentUser.email,

        jobTitle: job.jobTitle || '',
        companyName: job.businessName || job.companyName || 'ไม่ระบุร้านค้า',

        status: 'pending',
        appliedAt: serverTimestamp()
      });

      Alert.alert('สำเร็จ', 'สมัครงานเรียบร้อยแล้ว');
    } catch (error) {
      console.log(error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถสมัครงานได้');
    } finally {
      setApplyingJobId(null);
    }
  };
const handleSaveJob = async (job) => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    Alert.alert('แจ้งเตือน', 'กรุณาเข้าสู่ระบบ');
    return;
  }

  try {
    await addDoc(collection(db, 'savedJobs'), {
      studentId: currentUser.uid,

      jobId: job.id,
      employerId: job.employerId,

      jobTitle: job.jobTitle || '',
      companyName: job.businessName || job.companyName || '',
      location: job.location || '',
      salary: job.salary || '',
      jobType: job.jobType || '',
      quantity: job.quantity || '',

      savedAt: serverTimestamp()
    });

    Alert.alert('สำเร็จ', 'บันทึกงานแล้ว');
  } catch (error) {
    console.log(error);
    Alert.alert('ผิดพลาด', 'บันทึกงานไม่สำเร็จ');
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

  const pendingCount = applications.filter(
    (item) => item.status === 'pending'
  ).length;

  const acceptedCount = applications.filter(
    (item) => item.status === 'accepted'
  ).length;

  const latestApplications = applications.slice(0, 2);
 const recommendedJobs = jobs;
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brandName}>UinJob Connect</Text>

      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#7B42F6" />
          <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Stat Cards */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statInfo}>
                <Text style={styles.statNumber}>{jobs.length}</Text>
                <FontAwesome5 name="briefcase" size={16} color="#7B42F6" />
              </View>
              <Text style={styles.statLabel}>งานทั้งหมด</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statInfo}>
                <Text style={styles.statNumber}>{pendingCount}</Text>
                <Ionicons name="time-outline" size={18} color="#FFD700" />
              </View>
              <Text style={styles.statLabel}>รอพิจารณา</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statInfo}>
                <Text style={styles.statNumber}>{acceptedCount}</Text>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
              </View>
              <Text style={styles.statLabel}>ผ่านการพิจารณา</Text>
            </View>
          </View>

          {/* งานที่สมัครล่าสุด */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>งานที่สมัครล่าสุด</Text>
          </View>

          <View style={styles.recentJobCard}>
            {latestApplications.length === 0 ? (
              <View style={styles.emptyMiniBox}>
                <Text style={styles.emptyText}>ยังไม่มีงานที่สมัคร</Text>
              </View>
            ) : (
              latestApplications.map((item) => (
                <View key={item.id} style={styles.jobItem}>
                  <Text style={styles.jobTitleSmall}>
                    {item.jobTitle || 'ไม่ระบุชื่องาน'}
                  </Text>
                  <Text style={styles.jobCompanySmall}>
                    {item.companyName || 'ไม่ระบุร้านค้า'} - {formatDate(item.appliedAt)}
                  </Text>
                </View>
              ))
            )}

            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => setPage('applied')}
            >
              <Text style={styles.viewAllText}>ดูทั้งหมด</Text>
            </TouchableOpacity>
          </View>

          {/* งานแนะนำ */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>งานแนะนำสำหรับคุณ</Text>
          </View>

          {recommendedJobs.length === 0 ? (
            <View style={styles.recommendCard}>
              <View style={styles.emptyBox}>
                <Ionicons name="briefcase-outline" size={45} color="#C4C4C4" />
                <Text style={styles.emptyTitle}>ยังไม่มีงานแนะนำ</Text>
                <Text style={styles.emptyText}>
                  เมื่องานได้รับการอนุมัติจากแอดมิน จะแสดงที่หน้านี้
                </Text>
              </View>
            </View>
          ) : (
            recommendedJobs.map((job) => {
              const applied = hasApplied(job.id);
              const isApplying = applyingJobId === job.id;

              return (
                <View key={job.id} style={styles.recommendCard}>
                  <View style={styles.recommendHeader}>
                    <View style={styles.logoBox}>
                      <Text style={styles.logoTextInside}>
                        {(job.businessName || job.companyName || 'U').charAt(0)}
                      </Text>
                    </View>

                    <View style={styles.recommendTitleGroup}>
                      <Text style={styles.recommendJobTitle}>
                        {job.jobTitle || 'ไม่ระบุชื่องาน'}
                      </Text>
                     <Text style={styles.recommendCompany}>
                     {job.businessName || 'ไม่ระบุร้านค้า'}
                     </Text>
                    </View>

                    <TouchableOpacity
  onPress={() => !isSaved(job.id) && handleSaveJob(job)}
>
  <Ionicons
  name={isSaved(job.id) ? 'bookmark' : 'bookmark-outline'}
  size={20}
  color="#7B42F6"
/>
</TouchableOpacity>
                  </View>

                  <View style={styles.tagRow}>
                    <Ionicons name="location-outline" size={14} color="#666" />
                    <Text style={styles.tagText}>
                      {job.location || 'ไม่ระบุสถานที่'}
                    </Text>
                  </View>

                  <View style={styles.badgeRow}>
                    <View style={[styles.badge, { backgroundColor: '#FFF4E5' }]}>
                      <Text style={[styles.badgeText, { color: '#FF9800' }]}>
                        {job.salary || 'ไม่ระบุค่าตอบแทน'}
                      </Text>
                    </View>

                    <View style={[styles.badge, { backgroundColor: '#EFEAFF' }]}>
                      <Text style={[styles.badgeText, { color: '#7B42F6' }]}>
                        {job.jobType || 'Part-time'}
                      </Text>
                    </View>

                    <View style={[styles.badge, { backgroundColor: '#F0F0F0' }]}>
                      <Text style={[styles.badgeText, { color: '#666' }]}>
                        รับ {job.quantity || '-'} คน
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.timeText}>
                    <Ionicons name="time-outline" size={12} /> {formatDateAgo(job.createdAt)}
                  </Text>

                  <TouchableOpacity
                    style={[styles.mainBtn, applied && styles.disabledBtn]}
                    onPress={() => handleApplyJob(job)}
                    disabled={applied || isApplying}
                  >
                    {isApplying ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.mainBtnText}>
                        {applied ? 'สมัครแล้ว' : 'สมัครงาน'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Bottom Tab Bar */}
      <View style={styles.bottomTab}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setPage('home')}>
          <Ionicons name="home" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setPage('applied')}>
          <Ionicons name="briefcase-outline" size={24} color="#C4C4C4" />
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

  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },

  loadingText: {
    marginTop: 10,
    color: '#666'
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 100
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25
  },

  statCard: {
    backgroundColor: 'white',
    width: '31%',
    padding: 12,
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5
  },

  statInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  statNumber: {
    fontSize: 18,
    fontWeight: 'bold'
  },

  statLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 5
  },

  sectionHeader: {
    marginBottom: 10
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold'
  },

  recentJobCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 25
  },

  jobItem: {
    marginBottom: 15
  },

  jobTitleSmall: {
    fontSize: 13,
    fontWeight: 'bold'
  },

  jobCompanySmall: {
    fontSize: 11,
    color: '#999',
    marginTop: 2
  },

  viewAllBtn: {
    backgroundColor: '#7B42F6',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center'
  },

  viewAllText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13
  },

  recommendCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginBottom: 15
  },

  recommendHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  logoBox: {
    width: 45,
    height: 45,
    backgroundColor: '#FFE5B4',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },

  logoTextInside: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9800'
  },

  recommendTitleGroup: {
    flex: 1,
    marginLeft: 12
  },

  recommendJobTitle: {
    fontSize: 15,
    fontWeight: 'bold'
  },

  recommendCompany: {
    fontSize: 12,
    color: '#999'
  },

  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10
  },

  tagText: {
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

  badgeText: {
    fontSize: 11,
    fontWeight: 'bold'
  },

  timeText: {
    fontSize: 11,
    color: '#999',
    marginTop: 10
  },

  mainBtn: {
    backgroundColor: '#7B42F6',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 15
  },

  disabledBtn: {
    backgroundColor: '#999'
  },

  mainBtnText: {
    color: 'white',
    fontWeight: 'bold'
  },

  emptyBox: {
    alignItems: 'center',
    paddingVertical: 25
  },

  emptyMiniBox: {
    paddingVertical: 15,
    alignItems: 'center'
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10
  },

  emptyText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 5
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