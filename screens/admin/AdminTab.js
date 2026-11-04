import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AdminTab({ activeTab, setPage }) {
  const tabs = [
    {
      id: 'admin-home',
      label: 'หลัก',
      activeIcon: 'grid',
      inactiveIcon: 'grid-outline'
    },
    {
      id: 'admin-users',
      label: 'ผู้ใช้',
      activeIcon: 'people',
      inactiveIcon: 'people-outline'
    },
    {
      id: 'admin-services',
      label: 'บริการ',
      activeIcon: 'briefcase',
      inactiveIcon: 'briefcase-outline'
    },
    {
      id: 'admin-reports',
      label: 'รายงาน',
      activeIcon: 'bar-chart',
      inactiveIcon: 'bar-chart-outline'
    },
    {
      id: 'admin-chat',
      label: 'แชท',
      activeIcon: 'chatbubbles',
      inactiveIcon: 'chatbubbles-outline'
    },
  ];

  return (
    <View style={styles.bottomTab}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabItem}
            onPress={() => setPage(tab.id)}
          >
            <Ionicons
              name={isActive ? tab.activeIcon : tab.inactiveIcon}
              size={23}
              color={isActive ? 'white' : '#C4C4C4'}
            />

            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomTab: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#7B42F6',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 999,
    elevation: 10,
  },

  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },

  label: {
    fontSize: 10,
    color: '#C4C4C4',
    marginTop: 4,
  },

  activeLabel: {
    color: 'white',
    fontWeight: 'bold',
  },
});