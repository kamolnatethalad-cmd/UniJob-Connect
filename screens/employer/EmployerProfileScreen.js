import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Firebase
import { auth, db } from '../../firebaseConfig';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function EmployerProfileScreen({ setPage, setIsLoggedIn }) {
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [address, setAddress] = useState('');
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

          setBusinessName(data.businessName || '');
          setBusinessType(data.businessType || '');
          setAddress(data.address || '');
          setPhone(data.phone || '');
          setEmail(data.email || currentUser.email || '');
        } else {
          Alert.alert('เกิดข้อผิดพลาด', 'ไม่พบข้อมูลโปรไฟล์ร้านค้า');
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
    if (!businessName || !businessType || !address || !phone || !email) {
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
        businessName: businessName,
        businessType: businessType,
        address: address,
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
      <View style={styles.header}>
        <Text style={styles.brandName}>UinJob Connect</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>โปรไฟล์ธุรกิจ</Text>

        <View style={styles.card}>
          <Text style={styles.label}>ชื่อธุรกิจ</Text>
          <TextInput
            style={styles.input}
            placeholder="เช่น The Coffee Club"
            value={businessName}
            onChangeText={setBusinessName}
          />

          <Text style={styles.label}>ประเภทธุรกิจ</Text>
          <TextInput
            style={styles.input}
            placeholder="เช่น คาเฟ่"
            value={businessType}
            onChangeText={setBusinessType}
          />

          <Text style={styles.label}>ที่อยู่</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            textAlignVertical="top"
            placeholder="ที่อยู่ธุรกิจ"
            value={address}
            onChangeText={setAddress}
          />

          <Text style={styles.label}>เบอร์โทร</Text>
          <TextInput
            style={styles.input}
            placeholder="0xx-xxx-xxxx"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Text style={styles.label}>อีเมล</Text>
          <TextInput
            style={styles.input}
            placeholder="shop@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
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

        <View style={{ height: 100 }} />
      </ScrollView>

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
          <Ionicons name="people-outline" size={24} color="#C4C4C4" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setPage('employer-profile')}
        >
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

  scrollContent: {
    padding: 20
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20
  },

  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    elevation: 3
  },

  label: {
    fontSize: 13,
    fontWeight: 'bold',
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

  textArea: {
    height: 80
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