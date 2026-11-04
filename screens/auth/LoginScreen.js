import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';

import { auth, db } from '../../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function LoginScreen({ setIsLoggedIn, goToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    try {
      setLoading(true);

      // 1. Login ด้วย Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const user = userCredential.user;

      // 2. ดึงข้อมูล user จาก Firestore
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        Alert.alert(
          'เกิดข้อผิดพลาด',
          'ไม่พบข้อมูลผู้ใช้ใน Firestore กรุณาติดต่อผู้ดูแลระบบ'
        );
        setLoading(false);
        return;
      }

      const userData = userSnap.data();

      // 3. เช็ก role
      if (!userData.role) {
        Alert.alert(
          'เกิดข้อผิดพลาด',
          'บัญชีนี้ยังไม่มี role กรุณาตรวจสอบข้อมูลใน Firestore'
        );
        setLoading(false);
        return;
      }

      // 4. ส่ง role กลับไป App.js
      setIsLoggedIn(true, userData.role);

    } catch (error) {
      console.log(error);

      let message = 'เข้าสู่ระบบไม่สำเร็จ';

      if (error.code === 'auth/invalid-email') {
        message = 'รูปแบบอีเมลไม่ถูกต้อง';
      } else if (error.code === 'auth/user-not-found') {
        message = 'ไม่พบบัญชีผู้ใช้นี้';
      } else if (error.code === 'auth/wrong-password') {
        message = 'รหัสผ่านไม่ถูกต้อง';
      } else if (error.code === 'auth/invalid-credential') {
        message = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      }

      Alert.alert('เข้าสู่ระบบไม่สำเร็จ', message);
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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>U</Text>
            </View>
            <Text style={styles.brandName}>Uinjob Connect</Text>
            <Text style={styles.subTitle}>
              แพลตฟอร์มหางานพาร์ทไทม์สำหรับนักศึกษา
            </Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Top Tab Switch */}
            <View style={styles.topTabContainer}>
              <TouchableOpacity style={[styles.topTab, styles.activeTopTab]}>
                <Text style={styles.activeTopTabText}>เข้าสู่ระบบ</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.topTab} onPress={goToRegister}>
                <Text style={styles.topTabText}>ลงทะเบียน</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.label}>อีเมล</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
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

              {/* ลืมรหัสผ่าน */}
              <TouchableOpacity
                style={styles.forgotBtn}
                onPress={() => Alert.alert('แจ้งเตือน', 'ยังไม่ได้ทำหน้าลืมรหัสผ่าน')}
              >
                <Text style={styles.forgotText}>ลืมรหัสผ่าน?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mainBtn}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.mainBtnText}>เข้าสู่ระบบ</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>ยังไม่มีบัญชี? </Text>
                <TouchableOpacity onPress={goToRegister}>
                  <Text style={styles.linkText}>สมัครสมาชิก</Text>
                </TouchableOpacity>
              </View>
            </View>
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
    paddingVertical: 40
  },

  header: {
    alignItems: 'center',
    marginBottom: 25
  },

  logoCircle: {
    width: 65,
    height: 65,
    backgroundColor: '#7B42F6',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoText: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold'
  },

  brandName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 10
  },

  subTitle: {
    fontSize: 13,
    color: '#333',
    marginTop: 5
  },

  card: {
    backgroundColor: 'white',
    marginHorizontal: 25,
    borderRadius: 25,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },

  topTabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 25
  },

  topTab: {
    flex: 1,
    paddingVertical: 12,
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

  formContainer: {
    width: '100%'
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
    marginBottom: 8
  },

  input: {
    backgroundColor: '#E8E8E8',
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
  },

  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 10
  },

  forgotText: {
    color: '#7B42F6',
    fontSize: 13
  },

  mainBtn: {
    backgroundColor: '#7B42F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 25,
  },

  mainBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20
  },

  footerText: {
    color: '#666',
    fontSize: 14
  },

  linkText: {
    color: '#7B42F6',
    fontWeight: 'bold',
    fontSize: 14
  }
});