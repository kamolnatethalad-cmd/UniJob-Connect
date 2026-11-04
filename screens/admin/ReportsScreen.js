import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { db } from '../../firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';

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
  green: '#10B981',
  greenBg: '#D1FAE5',
  amber: '#F59E0B',
  amberBg: '#FEF3C7',
  blue: '#3B82F6',
  blueBg: '#DBEAFE',
  accent: '#03A9F4',
  line: '#F3F4F6',
};

const r = {
  md: 8,
  lg: 12,
  xl: 16,
};

const shadow = {
  sm: {
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
};

function MiniBarChart({ data, labels, color }) {
  const max = Math.max(...data, 1);

  return (
    <View style={s.barsWrap}>
      {labels.map((label, index) => {
        const value = data[index] || 0;
        const height = `${Math.max((value / max) * 100, 4)}%`;

        return (
          <View key={label} style={s.barCol}>
            <Text style={s.barValue}>{value}</Text>

            <View style={s.barBg}>
              <View
                style={[
                  s.barFill,
                  {
                    height,
                    backgroundColor:
                      index === labels.length - 1 ? color : color + '66',
                  },
                ]}
              />
            </View>

            <Text
              style={[
                s.barLabel,
                index === labels.length - 1 && {
                  color,
                  fontWeight: '800',
                },
              ]}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function AdminReportsScreen({ setPage, activeTab }) {
  const [period, setPeriod] = useState('เดือน');

  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  const studentCount = users.filter((u) => u.role === 'student').length;
  const employerCount = users.filter((u) => u.role === 'employer').length;

  const pendingJobs = jobs.filter((j) => j.status === 'pending').length;
  const approvedJobs = jobs.filter((j) => j.status === 'approved').length;
  const rejectedJobs = jobs.filter((j) => j.status === 'rejected').length;

  const pendingApps = applications.filter((a) => a.status === 'pending').length;
  const acceptedApps = applications.filter((a) => a.status === 'accepted').length;
  const rejectedApps = applications.filter((a) => a.status === 'rejected').length;

  const successRate =
    applications.length === 0
      ? 0
      : Math.round((acceptedApps / applications.length) * 100);

  const approvedRate =
    jobs.length === 0
      ? 0
      : Math.round((approvedJobs / jobs.length) * 100);

  const monthLabels = useMemo(() => {
    const now = new Date();
    const labels = [];

    for (let i = 3; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(
        date.toLocaleDateString('th-TH', {
          month: 'short',
        })
      );
    }

    return labels;
  }, []);

  const recentMonths = useMemo(() => {
    const now = new Date();
    const months = [];

    for (let i = 3; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: date.getMonth(),
        year: date.getFullYear(),
      });
    }

    return months;
  }, []);

  const usersChartData = useMemo(() => {
    return recentMonths.map((m) => {
      return users.filter((user) => {
        if (!user.createdAt) return false;

        const date = new Date(user.createdAt);
        return date.getMonth() === m.month && date.getFullYear() === m.year;
      }).length;
    });
  }, [users, recentMonths]);

  const jobsChartData = useMemo(() => {
    return recentMonths.map((m) => {
      return jobs.filter((job) => {
        if (!job.createdAt?.seconds) return false;

        const date = new Date(job.createdAt.seconds * 1000);
        return date.getMonth() === m.month && date.getFullYear() === m.year;
      }).length;
    });
  }, [jobs, recentMonths]);

  const topCategories = [
    {
      name: 'นักศึกษา',
      value: studentCount,
      color: C.primary,
    },
    {
      name: 'ร้านค้า',
      value: employerCount,
      color: C.blue,
    },
    {
      name: 'งานอนุมัติ',
      value: approvedJobs,
      color: C.green,
    },
    {
      name: 'งานรออนุมัติ',
      value: pendingJobs,
      color: C.amber,
    },
    {
      name: 'งานไม่อนุมัติ',
      value: rejectedJobs,
      color: C.red,
    },
  ];

  const totalTop = Math.max(
    topCategories.reduce((sum, item) => sum + item.value, 0),
    1
  );

  const metrics = [
    {
      label: 'อัตราอนุมัติงาน',
      value: `${approvedRate}%`,
      icon: 'checkmark-circle-outline',
      color: C.green,
    },
    {
      label: 'อัตราผ่านการสมัคร',
      value: `${successRate}%`,
      icon: 'trending-up-outline',
      color: C.blue,
    },
    {
      label: 'ผู้ใช้ทั้งหมด',
      value: `${users.length} คน`,
      icon: 'people-outline',
      color: C.primary,
    },
    {
      label: 'ใบสมัครทั้งหมด',
      value: `${applications.length} รายการ`,
      icon: 'document-text-outline',
      color: C.amber,
    },
  ];

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <Text style={s.topTitle}>รายงาน & สถิติ</Text>
      </View>

      {loading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={s.loadingText}>กำลังโหลดรายงาน...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 90 }}
        >
          <View style={s.periodRow}>
            {['สัปดาห์', 'เดือน', 'ปี'].map((p) => (
              <TouchableOpacity
                key={p}
                style={[s.periodBtn, period === p && s.periodBtnActive]}
                onPress={() => setPeriod(p)}
              >
                <Text style={[s.periodTxt, period === p && s.periodTxtActive]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.summaryRow}>
            <View style={[s.summaryCard, { backgroundColor: '#EEF2FF' }]}>
              <Text style={s.summaryTiny}>ผู้ใช้ทั้งหมด</Text>
              <Text style={[s.summaryBig, { color: C.primary }]}>
                {users.length}
              </Text>

              <View style={s.growthRow}>
                <Ionicons name="people" size={12} color={C.primary} />
                <Text style={[s.growthTxt, { color: C.primary }]}>
                  นักศึกษา {studentCount} · ร้านค้า {employerCount}
                </Text>
              </View>
            </View>

            <View style={[s.summaryCard, { backgroundColor: C.greenBg }]}>
              <Text style={s.summaryTiny}>งานทั้งหมด</Text>
              <Text style={[s.summaryBig, { color: C.green }]}>
                {jobs.length}
              </Text>

              <View style={s.growthRow}>
                <Ionicons name="briefcase" size={12} color={C.green} />
                <Text style={[s.growthTxt, { color: C.green }]}>
                  อนุมัติ {approvedJobs}
                </Text>
              </View>
            </View>
          </View>

          <View style={s.summaryRow}>
            <View style={[s.summaryCard, { backgroundColor: C.amberBg }]}>
              <Text style={s.summaryTiny}>งานรออนุมัติ</Text>
              <Text style={[s.summaryBig, { color: C.amber }]}>
                {pendingJobs}
              </Text>

              <View style={s.growthRow}>
                <Ionicons name="time" size={12} color={C.amber} />
                <Text style={[s.growthTxt, { color: C.amber }]}>
                  รอตรวจสอบ
                </Text>
              </View>
            </View>

            <View style={[s.summaryCard, { backgroundColor: C.blueBg }]}>
              <Text style={s.summaryTiny}>ใบสมัครทั้งหมด</Text>
              <Text style={[s.summaryBig, { color: C.blue }]}>
                {applications.length}
              </Text>

              <View style={s.growthRow}>
                <Ionicons name="document-text" size={12} color={C.blue} />
                <Text style={[s.growthTxt, { color: C.blue }]}>
                  ผ่าน {acceptedApps}
                </Text>
              </View>
            </View>
          </View>

          <View style={s.chartCard}>
            <Text style={s.chartTitle}>ผู้ใช้ใหม่ 4 เดือนล่าสุด</Text>
            <MiniBarChart data={usersChartData} labels={monthLabels} color={C.primary} />
          </View>

          <View style={s.chartCard}>
            <Text style={s.chartTitle}>งานที่ประกาศ 4 เดือนล่าสุด</Text>
            <MiniBarChart data={jobsChartData} labels={monthLabels} color={C.green} />
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>สัดส่วนข้อมูลระบบ</Text>

            {topCategories.map((cat, i) => {
              const pct = Math.round((cat.value / totalTop) * 100);

              return (
                <View key={i} style={s.catRow}>
                  <View style={[s.catDot, { backgroundColor: cat.color }]} />

                  <Text style={s.catName}>{cat.name}</Text>

                  <View style={s.catBarBg}>
                    <View
                      style={[
                        s.catBarFill,
                        {
                          width: `${pct}%`,
                          backgroundColor: cat.color,
                        },
                      ]}
                    />
                  </View>

                  <Text style={[s.catPct, { color: cat.color }]}>
                    {cat.value}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>ตัวชี้วัดสำคัญ</Text>

            {metrics.map((m, i) => (
              <View
                key={i}
                style={[s.metricRow, i < metrics.length - 1 && s.metricBorder]}
              >
                <View style={[s.metricIcon, { backgroundColor: m.color + '18' }]}>
                  <Ionicons name={m.icon} size={18} color={m.color} />
                </View>

                <Text style={s.metricLabel}>{m.label}</Text>

                <Text style={[s.metricValue, { color: m.color }]}>
                  {m.value}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={s.exportBtn}
            onPress={() =>
              Alert.alert('ส่งออก', 'ยังไม่ได้เชื่อมระบบสร้าง PDF รายงาน')
            }
          >
            <Ionicons name="download-outline" size={18} color={C.red} />
            <Text style={s.exportTxt}>ส่งออกรายงาน PDF</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <AdminTab activeTab={activeTab || 'admin-reports'} setPage={setPage} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },

  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 10,
    color: C.text3,
  },

  topBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },

  topTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text1,
  },

  periodRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: C.surface,
    borderRadius: r.lg,
    padding: 4,
    ...shadow.sm,
  },

  periodBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: r.md,
  },

  periodBtnActive: {
    backgroundColor: C.red,
  },

  periodTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text3,
  },

  periodTxtActive: {
    color: '#fff',
    fontWeight: '800',
  },

  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 14,
  },

  summaryCard: {
    flex: 1,
    borderRadius: r.xl,
    padding: 16,
    ...shadow.sm,
  },

  summaryTiny: {
    fontSize: 10,
    fontWeight: '700',
    color: C.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  summaryBig: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 4,
  },

  growthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    flexWrap: 'wrap',
  },

  growthTxt: {
    fontSize: 11,
    fontWeight: '700',
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
    marginBottom: 16,
  },

  barsWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: 10,
  },

  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },

  barValue: {
    fontSize: 9,
    fontWeight: '700',
    color: C.text3,
    marginBottom: 4,
  },

  barBg: {
    width: '75%',
    flex: 1,
    backgroundColor: C.bg,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },

  barFill: {
    width: '100%',
    borderRadius: 6,
  },

  barLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.text3,
    marginTop: 5,
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
    fontSize: 14,
    fontWeight: '800',
    color: C.text1,
    marginBottom: 14,
  },

  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },

  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  catName: {
    width: 82,
    fontSize: 12,
    fontWeight: '600',
    color: C.text2,
  },

  catBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: C.bg,
    borderRadius: 4,
    overflow: 'hidden',
  },

  catBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  catPct: {
    width: 34,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
  },

  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },

  metricBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },

  metricIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },

  metricLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: C.text2,
  },

  metricValue: {
    fontSize: 14,
    fontWeight: '900',
  },

  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: C.red + '44',
    borderRadius: r.lg,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 14,
  },

  exportTxt: {
    color: C.red,
    fontWeight: '800',
    fontSize: 14,
  },
});