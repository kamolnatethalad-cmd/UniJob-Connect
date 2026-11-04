import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';

// Firebase
import { auth, db } from '../../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

export default function AddJobScreen({ setPage }) {
  const [jobTitle, setJobTitle] = useState('');
  const [jobType, setJobType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [salary, setSalary] = useState('');
  const [location, setLocation] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchText, setSearchText] = useState('');

  const [mapRegion, setMapRegion] = useState({
  latitude: 13.7563,
  longitude: 100.5018,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
});
 

  const [loading, setLoading] = useState(false);
  React.useEffect(() => {
  (async () => {
    try {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        return;
      }

      const currentLocation =
        await Location.getCurrentPositionAsync({});

      const coords = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      setSelectedLocation(coords);

      setMapRegion({
        ...coords,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      const address =
        await Location.reverseGeocodeAsync(coords);

      if (address.length > 0) {
        const place = address[0];

        const fullAddress = `
${place.name || ''}
${place.street || ''}
${place.district || ''}
${place.city || ''}
`.trim();

        setLocation(fullAddress);
      }
      
    } catch (error) {
      console.log(error);
    }
  })();
}, []);

  const handleAddJob = async () => {
    if (
      !jobTitle ||
      !jobType ||
      !quantity ||
      !salary ||
      !businessName ||
      !location ||
      !description ||
      !requirements
    ) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const currentUser = auth.currentUser;

    if (!currentUser) {
      Alert.alert('เกิดข้อผิดพลาด', 'กรุณาเข้าสู่ระบบก่อนลงประกาศงาน');
      return;
    }

    try {
      setLoading(true);

      await addDoc(collection(db, 'jobs'), {
        employerId: currentUser.uid,
        jobTitle: jobTitle,
        jobType: jobType,
        quantity: Number(quantity),
        salary: salary,
        businessName: businessName,
        location: location,
        latitude: selectedLocation?.latitude || null,
        longitude: selectedLocation?.longitude || null,
        description: description,
        requirements: requirements,

        // สถานะรอแอดมินอนุมัติ
        status: 'pending',

        createdAt: serverTimestamp()
      });

      Alert.alert('สำเร็จ', 'ประกาศงานของคุณถูกส่งไปรอการอนุมัติแล้ว');
      setPage('employer-home');

    } catch (error) {
      console.log(error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถลงประกาศงานได้');
    } finally {
      setLoading(false);
    }
  };
const handleSearchLocation = async () => {
  try {
    const result =
      await Location.geocodeAsync(searchText);

    if (result.length > 0) {
      const coords = {
        latitude: result[0].latitude,
        longitude: result[0].longitude,
      };

      setSelectedLocation(coords);

      setMapRegion({
        ...coords,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      const address =
        await Location.reverseGeocodeAsync(coords);

      if (address.length > 0) {
        const place = address[0];

        const fullAddress = `
${place.name || ''}
${place.street || ''}
${place.district || ''}
${place.city || ''}
`.trim();

        setLocation(fullAddress);
      }
    }
  } catch (error) {
    console.log(error);
  }
};
  return (
    <SafeAreaView style={styles.container}>
      {/* Header พร้อมปุ่มย้อนกลับ */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setPage('employer-home')}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>ลงประกาศงานใหม่</Text>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formCard}>

          <Text style={styles.label}>ชื่อตำแหน่งงาน</Text>
          <TextInput
            style={styles.input}
            placeholder="เช่น พนักงานชงกาแฟ"
            value={jobTitle}
            onChangeText={setJobTitle}
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.label}>ประเภทงาน</Text>
              <TextInput
                style={styles.input}
                placeholder="เช่น Part-time"
                value={jobType}
                onChangeText={setJobType}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.label}>จำนวนที่รับ (คน)</Text>
              <TextInput
                style={styles.input}
                placeholder="เช่น 2"
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />
            </View>
          </View>

          <Text style={styles.label}>ค่าตอบแทน (ระบุหน่วยด้วย)</Text>
          <TextInput
            style={styles.input}
            placeholder="เช่น ฿500/วัน หรือ ฿50/ชม."
            value={salary}
            onChangeText={setSalary}
          />

          <Text style={styles.label}>ชื่อร้าน / บริษัท</Text>
<TextInput
  style={styles.input}
  placeholder="เช่น Cafe Amazon"
  value={businessName}
  onChangeText={setBusinessName}
/>

          <Text style={styles.label}>สถานที่ปฏิบัติงาน</Text>
          <TextInput
            style={styles.input}
            placeholder="ระบุชื่อร้าน หรือที่อยู่"
            value={location}
            onChangeText={setLocation}
          />
         
<Text style={styles.label}>เลือกตำแหน่งบนแผนที่</Text>
<GooglePlacesAutocomplete

  placeholder="ค้นหาร้าน หรือสถานที่"
  fetchDetails={true}
  enablePoweredByContainer={false}
  onPress={(data, details = null) => {
    const lat = details.geometry.location.lat;
    const lng = details.geometry.location.lng;

    const coords = {
      latitude: lat,
      longitude: lng,
    };

    setSelectedLocation(coords);

    setMapRegion({
      ...coords,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });

    setLocation(details.formatted_address);

    Alert.alert(
      'เลือกสถานที่แล้ว',
      details.name
    );
  }}
  query={{
    key: 'AIzaSyAe10zHQyEkCdqIGexhcXFtZzKwk5sUK7o',
    language: 'th',
    components: 'country:th',
  }}
  styles={{
  container: {
    flex: 0,
    marginBottom: 10,
    zIndex: 999,
  },

  listView: {
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 5,
    zIndex: 999,
  },

  textInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
}}
/>

<MapView
  style={styles.map}
  region={mapRegion}
  showsUserLocation
  showsMyLocationButton
  onLongPress={async (e) => {
  const coords = e.nativeEvent.coordinate;

  setSelectedLocation(coords);

  try {
    const address = await Location.reverseGeocodeAsync({
      latitude: coords.latitude,
      longitude: coords.longitude,
    });

    if (address.length > 0) {
      const place = address[0];

      const fullAddress = `
${place.name || ''}
${place.street || ''}
${place.district || ''}
${place.city || ''}
`.trim();

      setLocation(fullAddress);
      Alert.alert(
  'อัปเดตตำแหน่งแล้ว',
  fullAddress
);
    }
  } catch (error) {
    console.log(error);
  }
}}
>
  {selectedLocation && (
    <Marker
  coordinate={selectedLocation}
  draggable
 onDragEnd={async (e) => {
  const coords = e.nativeEvent.coordinate;

  setSelectedLocation(coords);

  try {
    const address = await Location.reverseGeocodeAsync({
      latitude: coords.latitude,
      longitude: coords.longitude,
    });

    if (address.length > 0) {
      const place = address[0];

      const fullAddress = `
${place.name || ''}
${place.street || ''}
${place.district || ''}
${place.city || ''}
`.trim();

      setLocation(fullAddress);
      Alert.alert(
  'อัปเดตตำแหน่งแล้ว',
  fullAddress
);
    }
  } catch (error) {
    console.log(error);
  }
}}
/>
  )}
</MapView>

          <Text style={styles.label}>รายละเอียดงาน</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="อธิบายหน้าที่ความรับผิดชอบ..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />

          <Text style={styles.label}>คุณสมบัติผู้สมัคร</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="เช่น เพศหญิง, อายุ 18-25 ปี, สามารถทำงานเสาร์-อาทิตย์ได้"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={requirements}
            onChangeText={setRequirements}
          />

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.disabledBtn]}
            onPress={handleAddJob}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>ยืนยันการประกาศงาน</Text>
            )}
          </TouchableOpacity>

        </View>
      </ScrollView>
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
    padding: 20,
    backgroundColor: 'white',
    elevation: 2,
    paddingTop: 40,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },

  scrollContent: {
    padding: 20
  },

  formCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10
  },

  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 8
  },

  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },

  textArea: {
    height: 100,
    textAlignVertical: 'top'
  },

  submitBtn: {
    backgroundColor: '#7B42F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
    shadowColor: '#7B42F6',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5
  },

  disabledBtn: {
    opacity: 0.7
  },

  submitBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  map: {
  width: '100%',
  height: 220,
  marginTop: 10,
  borderRadius: 15,
  overflow: 'hidden',
  marginBottom: 10
},
searchBtn: {
  backgroundColor: '#7B42F6',
  padding: 12,
  borderRadius: 10,
  alignItems: 'center',
  marginTop: 10,
  marginBottom: 10,
},

searchBtnText: {
  color: 'white',
  fontWeight: 'bold',
},
});