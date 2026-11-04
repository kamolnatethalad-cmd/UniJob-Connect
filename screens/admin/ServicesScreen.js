import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { db } from '../../firebaseConfig';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
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
  line: '#F3F4F6',
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

const ST_MAP = {
  approved: {
    label: 'อนุมัติ',
    color: C.green,
    bg: C.greenBg,
  },
  pending: {
    label: 'รออนุมัติ',
    color: C.amber,
    bg: C.amberBg,
  },
  rejected: {
    label: 'ปฏิเสธ',
    color: C.red,
    bg: C.redBg,
  },
  closed: {
    label: 'ปิดรับ',
    color: C.text3,
    bg: C.bg,
  },
};

export default function AdminServicesScreen({ setPage, activeTab }) {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ทั้งหมด');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'jobs'),
      (snapshot) => {
        const data = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }));

        data.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });

        setJobs(data);
        setLoading(false);
      },
      (error) => {
        console.log(error);
        Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลงานได้');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const approveJob = async (id) => {
    try {
      await updateDoc(doc(db, 'jobs', id), {
        status: 'approved',
      });

      Alert.alert('สำเร็จ', 'อนุมัติงานเรียบร้อยแล้ว');
    } catch (error) {
      console.log(error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถอนุมัติงานได้');
    }
  };

  const rejectJob = async (id) => {
    try {
      await updateDoc(doc(db, 'jobs', id), {
        status: 'rejected',
      });

      Alert.alert('สำเร็จ', 'ปฏิเสธงานเรียบร้อยแล้ว');
    } catch (error) {
      console.log(error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถปฏิเสธงานได้');
    }
  };

  const deleteJob = (id) => {
    Alert.alert('ลบประกาศงาน?', 'คุณต้องการลบประกาศงานนี้ใช่หรือไม่?', [
      {
        text: 'ยกเลิก',
        style: 'cancel',
      },
      {
        text: 'ลบ',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'jobs', id));
            Alert.alert('สำเร็จ', 'ลบประกาศงานเรียบร้อยแล้ว');
          } catch (error) {
            console.log(error);
            Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถลบงานได้');
          }
        },
      },
    ]);
  };

  const viewJob = (job) => {
    Alert.alert(
      job.jobTitle || 'รายละเอียดงาน',
      `ร้านค้า: ${job.businessName || job.companyName || 'ไม่ระบุ'}\nประเภทงาน: ${job.jobType || '-'}\nจำนวนที่รับ: ${job.quantity || '-'} คน\nค่าตอบแทน: ${job.salary || '-'}\nสถานที่: ${job.location || '-'}\n\nรายละเอียดงาน:\n${job.description || '-'}\n\nคุณสมบัติ:\n${job.requirements || '-'}`
    );
  };

  const filteredJobs = jobs.filter((job) => {
    const q = search.toLowerCase();

    const title = (job.jobTitle || '').toLowerCase();
    const businessName = (job.businessName || job.companyName || '').toLowerCase();
    const jobType = (job.jobType || '').toLowerCase();

    const matchSearch =
      !q ||
      title.includes(q) ||
      businessName.includes(q) ||
      jobType.includes(q);

    const matchFilter =
      filter === 'ทั้งหมด' ||
      (filter === 'รออนุมัติ' && job.status === 'pending') ||
      (filter === 'อนุมัติแล้ว' && job.status === 'approved') ||
      (filter === 'ปฏิเสธ' && job.status === 'rejected');

    return matchSearch && matchFilter;
  });

  const pendingCount = jobs.filter((job) => job.status === 'pending').length;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <Text style={s.topTitle}>จัดการประกาศงาน</Text>

        <View style={s.alertPill}>
          <Text style={s.alertPillTxt}>{pendingCount} รออนุมัติ</Text>
        </View>
      </View>

      {loading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={s.loadingText}>กำลังโหลดข้อมูลงาน...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredJobs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 90,
          }}
          ListHeaderComponent={
            <View>
              <View style={s.searchBox}>
                <Ionicons name="search-outline" size={17} color={C.text3} />

                <TextInput
                  style={s.searchInput}
                  placeholder="ค้นหาประกาศงาน..."
                  placeholderTextColor={C.text3}
                  value={search}
                  onChangeText={setSearch}
                />
              </View>

              <View style={s.filterRow}>
                {['ทั้งหมด', 'รออนุมัติ', 'อนุมัติแล้ว', 'ปฏิเสธ'].map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[s.filterChip, filter === f && s.filterChipActive]}
                    onPress={() => setFilter(f)}
                  >
                    <Text
                      style={[
                        s.filterTxt,
                        filter === f && {
                          color: '#fff',
                          fontWeight: '800',
                        },
                      ]}
                    >
                      {f}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <Ionicons name="briefcase-outline" size={55} color="#C4C4C4" />
              <Text style={s.emptyTitle}>ไม่พบประกาศงาน</Text>
              <Text style={s.emptyText}>
                ยังไม่มีงาน หรือไม่มีงานที่ตรงกับตัวกรอง
              </Text>
            </View>
          }
          renderItem={({ item: job }) => {
            const status = ST_MAP[job.status] || ST_MAP.pending;

            return (
              <View style={[s.card, { borderLeftColor: status.color }]}>
                <View style={s.cardThumb}>
                  <Ionicons name="briefcase-outline" size={24} color={C.primary} />
                </View>

                <View style={{ flex: 1, paddingLeft: 10 }}>
                  <Text style={s.svcTitle} numberOfLines={1}>
                    {job.jobTitle || 'ไม่ระบุชื่องาน'}
                  </Text>

                  <Text style={s.svcSeller} numberOfLines={1}>
                    {job.businessName || job.companyName || 'ไม่ระบุร้านค้า'} · {job.jobType || 'ไม่ระบุประเภท'}
                  </Text>

                  <Text style={s.svcPrice}>
                    {job.salary || 'ไม่ระบุค่าตอบแทน'}
                  </Text>

                  <Text style={s.svcLocation} numberOfLines={1}>
                    {job.location || 'ไม่ระบุสถานที่'}
                  </Text>
                </View>

                <View style={s.cardRight}>
                  <View style={[s.stBadge, { backgroundColor: status.bg }]}>
                    <Text style={[s.stTxt, { color: status.color }]}>
                      {status.label}
                    </Text>
                  </View>

                  <View style={s.btns}>
                    <TouchableOpacity
                      style={s.viewBtn}
                      onPress={() => viewJob(job)}
                    >
                      <Ionicons name="eye-outline" size={13} color={C.primary} />
                    </TouchableOpacity>

                    {job.status === 'pending' && (
                      <>
                        <TouchableOpacity
                          style={s.approveBtn}
                          onPress={() => approveJob(job.id)}
                        >
                          <Ionicons name="checkmark" size={13} color="#fff" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={s.rejectBtn}
                          onPress={() => rejectJob(job.id)}
                        >
                          <Ionicons name="close" size={13} color="#fff" />
                        </TouchableOpacity>
                      </>
                    )}

                    <TouchableOpacity
                      style={s.deleteBtn}
                      onPress={() => deleteJob(job.id)}
                    >
                      <Ionicons name="trash-outline" size={13} color={C.red} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      <AdminTab activeTab={activeTab || 'admin-services'} setPage={setPage} />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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

  alertPill: {
    backgroundColor: C.redBg,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: r.full,
  },

  alertPillTxt: {
    fontSize: 11,
    fontWeight: '800',
    color: C.red,
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: r.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    ...shadow.sm,
    marginBottom: 12,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: C.text1,
  },

  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },

  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: r.full,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.border,
  },

  filterChipActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },

  filterTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: C.text2,
  },

  emptyBox: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 30,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: C.text1,
    marginTop: 15,
  },

  emptyText: {
    fontSize: 13,
    color: C.text3,
    textAlign: 'center',
    marginTop: 8,
  },

  card: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: r.xl,
    marginBottom: 10,
    overflow: 'hidden',
    borderLeftWidth: 4,
    ...shadow.sm,
  },

  cardThumb: {
    width: 68,
    backgroundColor: C.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },

  svcTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text1,
    marginTop: 12,
    marginBottom: 3,
  },

  svcSeller: {
    fontSize: 11,
    color: C.text3,
    marginBottom: 3,
  },

  svcPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: C.primary,
    marginBottom: 2,
  },

  svcLocation: {
    fontSize: 10,
    color: C.text3,
    marginBottom: 10,
  },

  cardRight: {
    padding: 10,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },

  stBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: r.full,
    marginBottom: 8,
  },

  stTxt: {
    fontSize: 10,
    fontWeight: '800',
  },

  btns: {
    flexDirection: 'row',
    gap: 5,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },

  viewBtn: {
    width: 28,
    height: 28,
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  approveBtn: {
    width: 28,
    height: 28,
    backgroundColor: C.green,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  rejectBtn: {
    width: 28,
    height: 28,
    backgroundColor: C.amber,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  deleteBtn: {
    width: 28,
    height: 28,
    backgroundColor: C.redBg,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});