import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { auth, db } from '../../firebaseConfig';
import { signOut } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  updateDoc,
} from 'firebase/firestore';

import AdminTab from './AdminTab';

const C = {
  primary: '#7B42F6',
  bg: '#F8F9FE',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  text1: '#1F2937',
  text2: '#4B5563',
  text3: '#9CA3AF',
  red: '#EF4444',
  redBg: '#FEE2E2',
  green: '#10B981',
  greenBg: '#D1FAE5',
  amber: '#F59E0B',
  amberBg: '#FEF3C7',
  blue: '#3B82F6',
  blueBg: '#DBEAFE',
  line: '#F3F4F6',
  accent: '#03A9F4',
  accentSoft: '#E1F5FE',
};

const r = {
  lg: 12,
  xl: 16,
  full: 99,
};

const shadow = {
  sm: {
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
};

function BarChart({ data, labels, color, barHeight = 90 }) {
  const maxV = Math.max(...data, 1);

  return (
    <View style={ch.wrap}>
      {data.map((v, i) => {
        const h = Math.max((v / maxV) * barHeight, 4);

        return (
          <View key={i} style={ch.col}>
            <Text style={ch.val}>{v}</Text>

            <View
              style={[
                ch.bar,
                {
                  height: h,
                  backgroundColor: i === data.length - 1 ? color : color + '70',
                },
              ]}
            />

            <Text style={ch.lbl}>{labels[i]}</Text>
          </View>
        );
      })}
    </View>
  );
}

function ProfileModal({ visible, onClose, adminProfile, onSave }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    setName(adminProfile?.name || 'Admin');
    setPhone(adminProfile?.phone || '');
  }, [adminProfile, visible]);

  const save = () => {
    if (!name.trim()) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกชื่อ');
      return;
    }

    onSave({
      name: name.trim(),
      phone: phone.trim(),
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={pr.overlay}>
        <View style={pr.sheet}>
          <View style={pr.handle} />

          <View style={pr.avatarWrap}>
            <View style={pr.avatar}>
              <Text style={pr.avatarTxt}>{(name[0] || 'A').toUpperCase()}</Text>
            </View>

            <View style={pr.adminBadge}>
              <Text style={pr.adminBadgeTxt}>แอดมิน</Text>
            </View>
          </View>

          <Text style={pr.title}>โปรไฟล์แอดมิน</Text>

          <Text style={pr.label}>ชื่อ</Text>
          <View style={pr.inputRow}>
            <Ionicons name="person-outline" size={15} color={C.text3} style={{ marginRight: 8 }} />
            <TextInput style={pr.input} value={name} onChangeText={setName} />
          </View>

          <Text style={pr.label}>อีเมล</Text>
          <View style={pr.inputRow}>
            <Ionicons name="mail-outline" size={15} color={C.text3} style={{ marginRight: 8 }} />
            <TextInput
              style={pr.input}
              value={adminProfile?.email || auth.currentUser?.email || ''}
              editable={false}
            />
          </View>

          <Text style={pr.label}>เบอร์โทร</Text>
          <View style={pr.inputRow}>
            <Ionicons name="call-outline" size={15} color={C.text3} style={{ marginRight: 8 }} />
            <TextInput
              style={pr.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="เบอร์โทร"
            />
          </View>

          <TouchableOpacity style={pr.saveBtn} onPress={save}>
            <Ionicons name="save-outline" size={16} color="#fff" />
            <Text style={pr.saveTxt}>บันทึกโปรไฟล์</Text>
          </TouchableOpacity>

          <TouchableOpacity style={pr.cancelBtn} onPress={onClose}>
            <Text style={pr.cancelTxt}>ปิด</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function UsersModal({ visible, onClose, users }) {
  const toggleBan = async (user) => {
    try {
      await updateDoc(doc(db, 'users', user.id), {
        isBanned: !user.isBanned,
      });

      Alert.alert(
        'สำเร็จ',
        user.isBanned ? 'ปลดแบนผู้ใช้เรียบร้อยแล้ว' : 'แบนผู้ใช้เรียบร้อยแล้ว'
      );
    } catch (error) {
      console.log(error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถอัปเดตสถานะผู้ใช้ได้');
    }
  };

  const getDisplayName = (user) => {
    if (user.role === 'employer') return user.businessName || user.email || 'ร้านค้า';
    if (user.role === 'admin') return user.name || user.email || 'Admin';

    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return fullName || user.email || 'นักศึกษา';
  };

  const getRoleText = (role) => {
    if (role === 'student') return 'นักศึกษา';
    if (role === 'employer') return 'ผู้ประกอบการ';
    if (role === 'admin') return 'แอดมิน';
    return 'ไม่ระบุ';
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={mo.overlay}>
        <View style={[mo.sheet, { maxHeight: '80%' }]}>
          <View style={mo.handle} />
          <Text style={mo.title}>จัดการผู้ใช้งาน</Text>

          <FlatList
            data={users}
            keyExtractor={(u) => u.id}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: C.line }} />}
            renderItem={({ item: u }) => (
              <View style={mo.userRow}>
                <View
                  style={[
                    mo.avatar,
                    {
                      backgroundColor:
                        u.role === 'employer'
                          ? C.accent + '30'
                          : u.role === 'admin'
                          ? C.red + '25'
                          : C.primary + '30',
                    },
                  ]}
                >
                  <Text
                    style={[
                      mo.avatarTxt,
                      {
                        color:
                          u.role === 'employer'
                            ? C.accent
                            : u.role === 'admin'
                            ? C.red
                            : C.primary,
                      },
                    ]}
                  >
                    {getDisplayName(u).charAt(0)}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={mo.userName}>{getDisplayName(u)}</Text>
                  <Text style={mo.userEmail}>{u.email || '-'}</Text>
                  <Text style={mo.userRole}>{getRoleText(u.role)}</Text>
                </View>

                {u.role !== 'admin' && (
                  <TouchableOpacity onPress={() => toggleBan(u)}>
                    <Ionicons
                      name={u.isBanned ? 'lock-open-outline' : 'ban-outline'}
                      size={22}
                      color={u.isBanned ? C.green : C.red}
                    />
                  </TouchableOpacity>
                )}
              </View>
            )}
          />

          <TouchableOpacity style={mo.cancel} onPress={onClose}>
            <Text style={mo.cancelTxt}>ปิด</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function DashboardScreen({ setPage, setIsLoggedIn, activeTab }) {
  const [showUsers, setShowUsers] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [adminProfile, setAdminProfile] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setLoading(false);
      return;
    }

    const fetchAdminProfile = async () => {
      try {
        const adminRef = doc(db, 'users', currentUser.uid);
        const adminSnap = await getDoc(adminRef);

        if (adminSnap.exists()) {
          setAdminProfile({
            id: adminSnap.id,
            ...adminSnap.data(),
          });
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchAdminProfile();

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const data = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }));

        setUsers(data);
        setLoading(false);
      },
      (error) => {
        console.log(error);
        Alert.alert('เกิดข้อผิดพลาด', 'โหลดข้อมูลผู้ใช้ไม่สำเร็จ');
        setLoading(false);
      }
    );

    const unsubJobs = onSnapshot(
      collection(db, 'jobs'),
      (snapshot) => {
        const data = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }));

        setJobs(data);
      },
      (error) => {
        console.log(error);
      }
    );

    const unsubApps = onSnapshot(
      collection(db, 'applications'),
      (snapshot) => {
        const data = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }));

        setApplications(data);
      },
      (error) => {
        console.log(error);
      }
    );

    return () => {
      unsubUsers();
      unsubJobs();
      unsubApps();
    };
  }, []);

  const confirmLogout = () => {
    Alert.alert('ออกจากระบบ', 'ต้องการออกจากระบบใช่ไหม?', [
      {
        text: 'ยกเลิก',
        style: 'cancel',
      },
      {
        text: 'ออกจากระบบ',
        style: 'destructive',
        onPress: handleLogout,
      },
    ]);
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

  const handleSaveProfile = async ({ name, phone }) => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      Alert.alert('แจ้งเตือน', 'กรุณาเข้าสู่ระบบใหม่');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        name,
        phone,
        updatedAt: new Date().toISOString(),
      });

      setAdminProfile((prev) => ({
        ...prev,
        name,
        phone,
      }));

      setShowProfile(false);
      Alert.alert('สำเร็จ', 'บันทึกโปรไฟล์แอดมินเรียบร้อยแล้ว');
    } catch (error) {
      console.log(error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกโปรไฟล์ได้');
    }
  };

  const studentCount = users.filter((u) => u.role === 'student').length;
  const employerCount = users.filter((u) => u.role === 'employer').length;
  const pendingJobsCount = jobs.filter((j) => j.status === 'pending').length;
  const approvedJobsCount = jobs.filter((j) => j.status === 'approved').length;
  const acceptedAppsCount = applications.filter((a) => a.status === 'accepted').length;

  const monthLabels = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.'];

  const userChartData = useMemo(() => {
    const now = new Date();
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: d.getMonth(),
        year: d.getFullYear(),
      });
    }

    return months.map((m) => {
      return users.filter((u) => {
        if (!u.createdAt) return false;

        const d = new Date(u.createdAt);
        return d.getMonth() === m.month && d.getFullYear() === m.year;
      }).length;
    });
  }, [users]);

  const jobChartData = useMemo(() => {
    const now = new Date();
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: d.getMonth(),
        year: d.getFullYear(),
      });
    }

    return months.map((m) => {
      return jobs.filter((job) => {
        if (!job.createdAt?.seconds) return false;

        const d = new Date(job.createdAt.seconds * 1000);
        return d.getMonth() === m.month && d.getFullYear() === m.year;
      }).length;
    });
  }, [jobs]);

  const recentActivities = [
    {
      icon: 'person-add-outline',
      text: `มีผู้ใช้ทั้งหมด ${users.length} บัญชี`,
      time: 'อัปเดตล่าสุด',
      color: C.primary,
    },
    {
      icon: 'alert-circle-outline',
      text: `มีงานรออนุมัติ ${pendingJobsCount} รายการ`,
      time: 'รอตรวจสอบ',
      color: C.amber,
    },
    {
      icon: 'checkmark-circle-outline',
      text: `มีผู้สมัครที่ผ่านการพิจารณา ${acceptedAppsCount} รายการ`,
      time: 'จากใบสมัครทั้งหมด',
      color: C.green,
    },
    {
      icon: 'briefcase-outline',
      text: `งานที่อนุมัติแล้ว ${approvedJobsCount} รายการ`,
      time: 'พร้อมแสดงให้นักศึกษา',
      color: C.blue,
    },
  ];

  const stats = [
    {
      label: 'ผู้ใช้ทั้งหมด',
      val: users.length,
      icon: 'people-outline',
      color: C.primary,
      bg: '#EEF2FF',
    },
    {
      label: 'นักศึกษา',
      val: studentCount,
      icon: 'school-outline',
      color: C.blue,
      bg: C.blueBg,
    },
    {
      label: 'ร้านค้า',
      val: employerCount,
      icon: 'storefront-outline',
      color: C.accent,
      bg: C.accentSoft,
    },
    {
      label: 'งานรออนุมัติ',
      val: pendingJobsCount,
      icon: 'time-outline',
      color: C.amber,
      bg: C.amberBg,
    },
  ];

  return (
    <SafeAreaView style={s.safe}>
      <UsersModal visible={showUsers} onClose={() => setShowUsers(false)} users={users} />

      <ProfileModal
        visible={showProfile}
        onClose={() => setShowProfile(false)}
        adminProfile={adminProfile}
        onSave={handleSaveProfile}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>
        <View style={s.topBar}>
          <View style={s.topLeft}>
            <TouchableOpacity style={s.profileBtn} onPress={() => setShowProfile(true)}>
              <View style={s.profileAvatar}>
                <Text style={s.profileAvatarTxt}>
                  {(adminProfile?.name?.[0] || 'A').toUpperCase()}
                </Text>
              </View>
            </TouchableOpacity>

            <View>
              <Text style={s.topTitle}>Admin Dashboard</Text>
              <Text style={s.topSub}>
                ยินดีต้อนรับ, {adminProfile?.name || 'Admin'}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={s.logoutBadge} onPress={confirmLogout}>
            <Ionicons name="log-out-outline" size={16} color={C.red} />
            <Text style={s.logoutBadgeTxt}>ออกจากระบบ</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={s.loadingText}>กำลังโหลดข้อมูล...</Text>
          </View>
        ) : (
          <>
            <View style={s.alertBar}>
              <View style={s.alertIcon}>
                <Ionicons name="alert-circle" size={20} color={C.amber} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={s.alertTitle}>รออนุมัติ</Text>
                <Text style={s.alertDesc}>
                  งานใหม่ {pendingJobsCount} รายการ · ร้านค้าทั้งหมด {employerCount} ร้าน
                </Text>
              </View>
            </View>

            <View style={s.statsGrid}>
              {stats.map((st, i) => (
                <View key={i} style={[s.statCard, { backgroundColor: st.bg }]}>
                  <View style={[s.statIcon, { backgroundColor: st.color + '22' }]}>
                    <Ionicons name={st.icon} size={22} color={st.color} />
                  </View>

                  <Text style={[s.statVal, { color: st.color }]}>{st.val}</Text>
                  <Text style={s.statLabel}>{st.label}</Text>
                </View>
              ))}
            </View>

            <View style={s.chartCard}>
              <Text style={s.chartTitle}>ผู้ใช้ใหม่ 6 เดือนล่าสุด</Text>
              <BarChart data={userChartData} labels={monthLabels} color={C.primary} />
            </View>

            <View style={s.chartCard}>
              <Text style={s.chartTitle}>งานที่ประกาศ 6 เดือนล่าสุด</Text>
              <BarChart data={jobChartData} labels={monthLabels} color={C.green} />
            </View>

            <View style={s.section}>
              <Text style={s.sectionTitle}>การดำเนินการ</Text>

              <View style={s.actGrid}>
                <TouchableOpacity style={s.actCard} onPress={() => setShowUsers(true)}>
                  <View style={[s.actIcon, { backgroundColor: C.primary + '18' }]}>
                    <Ionicons name="people-outline" size={22} color={C.primary} />
                  </View>
                  <Text style={s.actLabel}>ผู้ใช้</Text>
                </TouchableOpacity>

                <TouchableOpacity style={s.actCard} onPress={() => setPage('admin-services')}>
                  <View style={[s.actIcon, { backgroundColor: C.blue + '18' }]}>
                    <Ionicons name="briefcase-outline" size={22} color={C.blue} />
                  </View>
                  <Text style={s.actLabel}>อนุมัติงาน</Text>
                </TouchableOpacity>

                <TouchableOpacity style={s.actCard} onPress={() => setPage('admin-chat')}>
                  <View style={[s.actIcon, { backgroundColor: C.accent + '18' }]}>
                    <Ionicons name="chatbubbles-outline" size={22} color={C.accent} />
                  </View>
                  <Text style={s.actLabel}>แชท</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={s.section}>
              <Text style={s.sectionTitle}>กิจกรรมล่าสุด</Text>

              {recentActivities.map((a, i) => (
                <View key={i} style={[s.actRow, i < recentActivities.length - 1 && s.actBorder]}>
                  <View style={[s.actIconWrap, { backgroundColor: a.color + '18' }]}>
                    <Ionicons name={a.icon} size={16} color={a.color} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={s.actText}>{a.text}</Text>
                    <Text style={s.actTime}>{a.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <AdminTab activeTab={activeTab || 'admin-home'} setPage={setPage} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },

  loadingBox: {
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 10,
    color: C.text3,
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },

  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  profileBtn: {
    padding: 2,
  },

  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.red + '22',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: C.red + '44',
  },

  profileAvatarTxt: {
    fontSize: 16,
    fontWeight: '900',
    color: C.red,
  },

  topTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: C.text1,
  },

  topSub: {
    fontSize: 11,
    color: C.text3,
    marginTop: 2,
  },

  logoutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.redBg,
    borderRadius: r.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  logoutBadgeTxt: {
    fontSize: 11,
    fontWeight: '800',
    color: C.red,
  },

  alertBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.amberBg,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: r.lg,
    padding: 14,
    gap: 10,
    borderWidth: 1.5,
    borderColor: C.amber + '44',
  },

  alertIcon: {
    width: 36,
    height: 36,
    backgroundColor: C.amber + '22',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  alertTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },

  alertDesc: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 14,
  },

  statCard: {
    width: '47.5%',
    borderRadius: r.xl,
    padding: 16,
    ...shadow.sm,
  },

  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  statVal: {
    fontSize: 22,
    fontWeight: '900',
  },

  statLabel: {
    fontSize: 11,
    color: C.text3,
    fontWeight: '600',
    marginTop: 3,
  },

  chartCard: {
    backgroundColor: C.surface,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: r.xl,
    padding: 18,
    ...shadow.sm,
  },

  chartTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: C.text1,
    marginBottom: 12,
  },

  section: {
    backgroundColor: C.surface,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: r.xl,
    padding: 18,
    ...shadow.sm,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.text1,
    marginBottom: 14,
  },

  actGrid: {
    flexDirection: 'row',
    gap: 10,
  },

  actCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: r.lg,
    paddingVertical: 14,
  },

  actIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },

  actLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.text2,
  },

  actRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },

  actBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },

  actIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  actText: {
    fontSize: 12,
    color: C.text1,
    fontWeight: '600',
  },

  actTime: {
    fontSize: 10,
    color: C.text3,
    marginTop: 3,
  },
});

const ch = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },

  col: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },

  bar: {
    width: '78%',
    borderRadius: 4,
  },

  val: {
    fontSize: 8,
    color: C.text3,
    fontWeight: '600',
  },

  lbl: {
    fontSize: 9,
    color: C.text3,
    fontWeight: '600',
  },
});

const mo = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },

  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 44,
  },

  handle: {
    width: 40,
    height: 4,
    backgroundColor: C.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },

  title: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text1,
    marginBottom: 16,
    textAlign: 'center',
  },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarTxt: {
    fontSize: 18,
    fontWeight: '900',
  },

  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text1,
  },

  userEmail: {
    fontSize: 11,
    color: C.text3,
    marginTop: 2,
  },

  userRole: {
    fontSize: 10,
    color: C.primary,
    marginTop: 2,
    fontWeight: '700',
  },

  cancel: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },

  cancelTxt: {
    color: C.text3,
    fontWeight: '600',
    fontSize: 14,
  },
});

const pr = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },

  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 44,
  },

  handle: {
    width: 40,
    height: 4,
    backgroundColor: C.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },

  avatarWrap: {
    alignItems: 'center',
    marginBottom: 4,
  },

  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.red + '22',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: C.red + '44',
  },

  avatarTxt: {
    fontSize: 28,
    fontWeight: '900',
    color: C.red,
  },

  adminBadge: {
    backgroundColor: C.red,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: r.full,
    marginTop: 8,
  },

  adminBadgeTxt: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 10,
  },

  title: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text1,
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 8,
  },

  label: {
    fontSize: 12,
    fontWeight: '700',
    color: C.text2,
    marginBottom: 6,
    marginTop: 10,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: r.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: C.bg,
  },

  input: {
    flex: 1,
    fontSize: 14,
    color: C.text1,
  },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.primary,
    paddingVertical: 14,
    borderRadius: r.lg,
    marginTop: 18,
  },

  saveTxt: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },

  cancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },

  cancelTxt: {
    color: C.text3,
    fontWeight: '600',
    fontSize: 14,
  },
});