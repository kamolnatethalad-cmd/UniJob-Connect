import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Firebase
import { auth, db } from '../../firebaseConfig';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function ProfileScreen({ setPage, setIsLoggedIn }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [university, setUniversity] = useState('');
  const [major, setMajor] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        Alert.alert('แจ้งเตือน', 'กรุณาเข้าสู่ระบบก่อนใช้งาน');
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();

          setFirstName(data.firstName || '');
          setLastName(data.lastName || '');
          setUniversity(data.university || '');
          setMajor(data.major || '');
          setPhone(data.phone || '');
          setEmail(data.email || currentUser.email || '');
        } else {
          Alert.alert('เกิดข้อผิดพลาด', 'ไม่พบข้อมูลโปรไฟล์');
        }
      } catch (error) {
        console.log(error);
        Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!firstName || !lastName || !university || !major || !phone || !email) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const currentUser = auth.currentUser;

    if (!currentUser) {
      Alert.alert('เกิดข้อผิดพลาด', 'กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
      return;
    }

    try {
      setSaving(true);

      const userRef = doc(db, 'users', currentUser.uid);

      await updateDoc(userRef, {
        firstName: firstName,
        lastName: lastName,
        university: university,
        major: major,
        phone: phone,
        email: email.trim(),
        updatedAt: new Date().toISOString()
      });

      Alert.alert('สำเร็จ', 'บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว');
    } catch (error) {
      console.log(error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#7B42F6" />
          <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brandName}>UinJob Connect</Text>

      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
      

            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {firstName ? firstName.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>

              <Text style={styles.profileName}>
                {firstName} {lastName}
              </Text>

              <Text style={styles.profileSub}>
                {university || 'ไม่ระบุมหาวิทยาลัย'}
              </Text>
            </View>

            {/* ฟอร์มข้อมูลส่วนตัว */}
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 5 }}>
                  <Text style={styles.label}>ชื่อ</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="ชื่อจริง"
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 5 }}>
                  <Text style={styles.label}>นามสกุล</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="นามสกุล"
                    value={lastName}
                    onChangeText={setLastName}
                  />
                </View>
              </View>

              <Text style={styles.label}>มหาวิทยาลัย</Text>
              <TextInput
                style={styles.input}
                placeholder="มหาวิทยาลัย"
                value={university}
                onChangeText={setUniversity}
              />

              <Text style={styles.label}>สาขาวิชา</Text>
              <TextInput
                style={styles.input}
                placeholder="สาขาวิชา"
                value={major}
                onChangeText={setMajor}
              />

              <Text style={styles.label}>เบอร์โทร</Text>
              <TextInput
                style={styles.input}
                placeholder="0xx-xxx-xxxx"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>อีเมล</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.disabledBtn]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>บันทึกการเปลี่ยนแปลง</Text>
                )}
              </TouchableOpacity>
               <TouchableOpacity
                        style={styles.logoutBtn}
                        onPress={handleLogout}
                      >
                        <Text style={styles.logoutBtnText}>ออกจากระบบ</Text>
                      </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

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
          <Ionicons name="notifications-outline" size={24} color="#C4C4C4" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setPage('profile')}>
          <Ionicons name="person" size={24} color="white" />
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

  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },

  loadingText: {
    marginTop: 10,
    color: '#666'
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

  scrollContent: {
    padding: 20
  },

  content: {
    flex: 1
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20
  },

  profileHeader: {
    alignItems: 'center',
    marginBottom: 20
  },

  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#7B42F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },

  avatarText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold'
  },

  profileName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333'
  },

  profileSub: {
    fontSize: 12,
    color: '#999',
    marginTop: 4
  },

  card: {
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },

  row: {
    flexDirection: 'row'
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 8
  },

  input: {
    backgroundColor: '#EAEAEA',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#333'
  },

  saveBtn: {
    backgroundColor: '#7B42F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30
  },

  disabledBtn: {
    opacity: 0.7
  },

  saveBtnText: {
    color: 'white',
    fontSize: 15,
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
  }, 

  logoutBtn: {
    backgroundColor: 'white',
    borderColor: 'red',
    borderWidth: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
  },
  logoutBtnText: {
    color: 'red',
    fontSize: 15,
    fontWeight: 'bold'
  },
});