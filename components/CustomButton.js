import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const CustomButton = ({ title, onPress, style, textStyle, outline }) => {
  return (
    <TouchableOpacity 
      // ถ้าใส่ prop 'outline' มา จะเปลี่ยนสไตล์เป็นแบบเส้นขอบสีม่วงแทน
      style={[
        styles.button, 
        outline ? styles.outlineButton : styles.filledButton, 
        style
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.text, 
        outline ? styles.outlineText : styles.filledText, 
        textStyle
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    width: '100%', // ให้ขยายเต็มพื้นที่ของ Container
  },
  filledButton: {
    backgroundColor: '#7B42F6', // สีม่วงหลักตามดีไซน์ UinJob
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#7B42F6',
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  filledText: {
    color: '#FFFFFF',
  },
  outlineText: {
    color: '#7B42F6',
  },
});

export default CustomButton;
