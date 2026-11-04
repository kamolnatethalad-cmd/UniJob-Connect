import React, { useState } from 'react'; // เพิ่ม useState
import {
  StyleSheet, Text, View, TextInput,
  TouchableOpacity, ScrollView,
  SafeAreaView, KeyboardAvoidingView, Platform,
  Alert // เพิ่ม Alert เพื่อแจ้งเตือนผู้ใช้
} from 'react-native';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';

// --- นำเข้า Firebase Config ---
import { auth, db } from '../../firebaseConfig'; 
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function StudentRegisterScreen({ goToLogin, goToEmployerRegister }) {
  // --- 1. สร้าง State สำหรับเก็บข้อมูลฟอร์ม ---
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [university, setUniversity] = useState('');
  const [major, setMajor] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // --- 2. ฟังก์ชันหลักในการลงทะเบียน ---
  const handleRegister = async () => {
   
    if (!email || !password || !firstName) {
      Alert.alert("แจ้งเตือน", "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        firstName: firstName,
        lastName: lastName,
        university: university,
        major: major,
        phone: phone,
        email: email,
        role: 'student', 
        createdAt: new Date().toISOString()
      });

      Alert.alert("สำเร็จ", "ลงทะเบียนนักศึกษาเรียบร้อยแล้ว!");
      goToLogin(); // สมัครเสร็จแล้วส่งไปหน้า Login
    } catch (error) {
      console.error(error);
      Alert.alert("เกิดข้อผิดพลาด", error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>U</Text>
            </View>
            <Text style={styles.brandName}>Uinjob Connect</Text>
            <Text style={styles.subTitle}>แพลตฟอร์มหางานพาร์ทไทม์สำหรับนักศึกษา</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.topTabContainer}>
              <TouchableOpacity style={styles.topTab} onPress={goToLogin}>
                <Text style={styles.topTabText}>เข้าสู่ระบบ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.topTab, styles.activeTopTab]}>
                <Text style={styles.activeTopTabText}>ลงทะเบียน</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>ประเภทผู้ใช้</Text>
            <View style={styles.row}>
              <TouchableOpacity style={[styles.subTab, styles.activeSubTab]}>
                <FontAwesome6 name="user-graduate" size={14} color="#7B42F6" style={{ marginRight: 8 }} />
                <Text style={styles.activeSubTabText}>นักศึกษา</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.subTab} onPress={goToEmployerRegister}>
                <FontAwesome6 name="briefcase" size={14} color="#666" style={{ marginRight: 8 }} />
                <Text style={styles.subTabText}>ผู้ประกอบการ</Text>
              </TouchableOpacity>
            </View>

            {/* --- เชื่อมต่อ State กับ TextInput --- */}
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
              placeholder="เช่น มหาวิทยาลัยเทคโนโลยีสุรนารี" 
              value={university}
              onChangeText={setUniversity}
            />

            <Text style={styles.label}>สาขาวิชา</Text>
            <TextInput 
              style={styles.input} 
              placeholder="เช่น วิศวกรรมคอมพิวเตอร์" 
              value={major}
              onChangeText={setMajor}
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

        
            <TouchableOpacity style={styles.mainBtn} onPress={handleRegister}>
              <Text style={styles.mainBtnText}>ลงทะเบียน</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>หรือ</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity style={styles.googleBtn}>
              <Ionicons name="logo-google" size={18} color="#000" style={{ marginRight: 10 }} />
              <Text style={styles.googleBtnText}>ลงทะเบียนด้วย Google</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2FF' },
  scrollContent: { paddingBottom: 40 },
  header: { alignItems: 'center', marginTop: 20, marginBottom: 20 },
  logoCircle: {
    width: 60, height: 60,
    backgroundColor: '#7B42F6',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: { color: 'white', fontSize: 32, fontWeight: 'bold' },
  brandName: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 10 },
  subTitle: { fontSize: 12, color: '#666', marginTop: 4 },

  card: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
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
  topTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTopTab: { backgroundColor: '#7B42F6' },
  topTabText: { color: '#666', fontWeight: '600' },
  activeTopTabText: { color: 'white', fontWeight: '600' },

  label: { fontSize: 13, fontWeight: 'bold', color: '#333', marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: '#EAEAEA',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#DDD'
  },

  row: { flexDirection: 'row', marginBottom: 5 },
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
  activeSubTab: { borderColor: '#7B42F6', backgroundColor: '#F0EBFF' },
  subTabText: { color: '#666', fontSize: 13 },
  activeSubTabText: { color: '#7B42F6', fontWeight: 'bold', fontSize: 13 },

  uploadBox: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
    backgroundColor: '#FAFAFA'
  },
  uploadText: { color: '#999', fontSize: 11, marginTop: 8 },

  consentRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15 },
  checkbox: { width: 18, height: 18, borderWidth: 1, borderColor: '#CCC', borderRadius: 4, marginRight: 8 },
  consentText: { fontSize: 11, color: '#333' },
  linkTextInline: { color: '#7B42F6', textDecorationLine: 'underline' },

  mainBtn: {
    backgroundColor: '#7B42F6',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20
  },
  mainBtnText: { color: 'white', fontSize: 15, fontWeight: 'bold' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: '#EEE' },
  dividerText: { marginHorizontal: 10, color: '#999', fontSize: 12 },

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
  googleBtnText: { color: '#333', fontWeight: '600', fontSize: 14 }
});
