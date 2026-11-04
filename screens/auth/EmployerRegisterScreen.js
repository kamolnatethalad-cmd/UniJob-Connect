import React, { useState } from 'react';
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

import { Ionicons, FontAwesome6 } from '@expo/vector-icons';

// --- Firebase ---
import { auth, db } from '../../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function EmployerRegisterScreen({ goToLogin, goToStudentRegister }) {
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('คาเฟ่');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!businessName || !businessType || !address || !phone || !email || !password) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (password.length < 6) {
      Alert.alert('แจ้งเตือน', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (!accepted) {
      Alert.alert('แจ้งเตือน', 'กรุณายอมรับข้อกำหนดการใช้งานก่อนลงทะเบียน');
      return;
    }

    try {
      setLoading(true);

      // 1. สร้างบัญชีใน Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const user = userCredential.user;

      // 2. บันทึกข้อมูลร้านค้าลง Firestore
      await setDoc(doc(db, 'users', user.uid), {
        businessName: businessName,
        businessType: businessType,
        address: address,
        phone: phone,
        email: email.trim(),
        role: 'employer',
        verifyStatus: 'pending',
        createdAt: new Date().toISOString()
      });

      Alert.alert('สำเร็จ', 'ลงทะเบียนผู้ประกอบการเรียบร้อยแล้ว');
      goToLogin();

    } catch (error) {
      console.log(error);

      let message = 'เกิดข้อผิดพลาดในการลงทะเบียน';

      if (error.code === 'auth/email-already-in-use') {
        message = 'อีเมลนี้ถูกใช้งานแล้ว';
      } else if (error.code === 'auth/invalid-email') {
        message = 'รูปแบบอีเมลไม่ถูกต้อง';
      } else if (error.code === 'auth/weak-password') {
        message = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
      }

      Alert.alert('ลงทะเบียนไม่สำเร็จ', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>

          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>U</Text>
            </View>
            <Text style={styles.brandName}>Uinjob Connect</Text>
            <Text style={styles.subTitle}>
              แพลตฟอร์มหางานพาร์ทไทม์สำหรับนักศึกษา
            </Text>
          </View>

          {/* Card Container */}
          <View style={styles.card}>

            {/* Top Navigation Tab */}
            <View style={styles.topTabContainer}>
              <TouchableOpacity style={styles.topTab} onPress={goToLogin}>
                <Text style={styles.topTabText}>เข้าสู่ระบบ</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.topTab, styles.activeTopTab]}>
                <Text style={styles.activeTopTabText}>ลงทะเบียน</Text>
              </TouchableOpacity>
            </View>

            {/* ประเภทผู้ใช้ */}
            <Text style={styles.label}>ประเภทผู้ใช้</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.subTab}
                onPress={goToStudentRegister}
              >
                <FontAwesome6
                  name="user-graduate"
                  size={14}
                  color="#666"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.subTabText}>นักศึกษา</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.subTab, styles.activeSubTab]}>
                <FontAwesome6
                  name="briefcase"
                  size={14}
                  color="#7B42F6"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.activeSubTabText}>ผู้ประกอบการ</Text>
              </TouchableOpacity>
            </View>

            {/* ข้อมูลธุรกิจ */}
            <Text style={styles.label}>ชื่อธุรกิจ</Text>
            <TextInput
              style={styles.input}
              placeholder="เช่น The Coffee Club"
              value={businessName}
              onChangeText={setBusinessName}
            />

            <Text style={styles.label}>ประเภทธุรกิจ</Text>
            <TouchableOpacity
              style={styles.dropdownPlaceholder}
              onPress={() => Alert.alert('แจ้งเตือน', 'ตอนนี้ตั้งค่าเริ่มต้นเป็น คาเฟ่')}
            >
              <Text style={{ color: '#333' }}>{businessType}</Text>
              <Ionicons name="chevron-down" size={18} color="#666" />
            </TouchableOpacity>

            <Text style={styles.label}>ที่อยู่</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="ที่อยู่ธุรกิจ"
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
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

            {/* อัปโหลดเอกสาร */}
            <Text style={styles.label}>เอกสารยืนยันตัวตน</Text>
            <TouchableOpacity
              style={styles.uploadBox}
              onPress={() => Alert.alert('แจ้งเตือน', 'ยังไม่ได้เชื่อมระบบอัปโหลดเอกสาร')}
            >
              <Ionicons name="cloud-upload-outline" size={28} color="#A9A9A9" />
              <Text style={styles.uploadText}>
                ใบทะเบียนพาณิชย์ หรือบัตรประชาชน
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>อีเมลร้านค้า</Text>
            <TextInput
              style={styles.input}
              placeholder="shop@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>รหัสผ่าน</Text>
            <TextInput
              style={styles.input}
              placeholder="********"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {/* เงื่อนไขการใช้งาน */}
            <TouchableOpacity
              style={styles.consentRow}
              onPress={() => setAccepted(!accepted)}
            >
              <View style={[styles.checkbox, accepted && styles.checkboxActive]}>
                {accepted && (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                )}
              </View>

              <Text style={styles.consentText}>
                ฉันยอมรับ{' '}
                <Text style={styles.linkTextInline}>ข้อกำหนดการใช้งาน</Text>
                {' '}และ{' '}
                <Text style={styles.linkTextInline}>นโยบายความเป็นส่วนตัว</Text>
              </Text>
            </TouchableOpacity>

            {/* ปุ่มลงทะเบียนหลัก */}
            <TouchableOpacity
              style={[styles.mainBtn, loading && styles.disabledBtn]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.mainBtnText}>ลงทะเบียน</Text>
              )}
            </TouchableOpacity>

            {/* ทางเลือกอื่นๆ */}
            <View style={styles.dividerRow}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>หรือ</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity
              style={styles.googleBtn}
              onPress={() => Alert.alert('แจ้งเตือน', 'ยังไม่ได้เชื่อม Google Sign-In')}
            >
              <Ionicons
                name="logo-google"
                size={18}
                color="#000"
                style={{ marginRight: 10 }}
              />
              <Text style={styles.googleBtnText}>ลงทะเบียนด้วย Google</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2FF'
  },

  scrollContent: {
    paddingBottom: 40
  },

  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20
  },

  logoCircle: {
    width: 60,
    height: 60,
    backgroundColor: '#7B42F6',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold'
  },

  brandName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10
  },

  subTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },

  card: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  topTabContainer: {
    flexDirection: 'row',
    backgroundColor: '#EAEAEA',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20
  },

  topTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10
  },

  activeTopTab: {
    backgroundColor: '#7B42F6'
  },

  topTabText: {
    color: '#666',
    fontWeight: '600'
  },

  activeTopTabText: {
    color: 'white',
    fontWeight: '600'
  },

  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 6
  },

  input: {
    backgroundColor: '#EAEAEA',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#DDD'
  },

  textArea: {
    height: 80
  },

  dropdownPlaceholder: {
    backgroundColor: '#EAEAEA',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD'
  },

  row: {
    flexDirection: 'row',
    marginBottom: 5
  },

  subTab: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: 4,
    backgroundColor: '#FFF'
  },

  activeSubTab: {
    borderColor: '#7B42F6',
    backgroundColor: '#F0EBFF'
  },

  subTabText: {
    color: '#666',
    fontSize: 13
  },

  activeSubTabText: {
    color: '#7B42F6',
    fontWeight: 'bold',
    fontSize: 13
  },

  uploadBox: {
    borderWidth: 1,
    borderColor: '#7B42F6',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 5,
    backgroundColor: '#FAFAFF'
  },

  uploadText: {
    color: '#999',
    fontSize: 11,
    marginTop: 8
  },

  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15
  },

  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },

  checkboxActive: {
    backgroundColor: '#7B42F6',
    borderColor: '#7B42F6'
  },

  consentText: {
    flex: 1,
    fontSize: 11,
    color: '#333'
  },

  linkTextInline: {
    color: '#7B42F6',
    textDecorationLine: 'underline'
  },

  mainBtn: {
    backgroundColor: '#7B42F6',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20
  },

  disabledBtn: {
    opacity: 0.7
  },

  mainBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold'
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#EEE'
  },

  dividerText: {
    marginHorizontal: 10,
    color: '#999',
    fontSize: 12
  },

  googleBtn: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF'
  },

  googleBtnText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 14
  }
});