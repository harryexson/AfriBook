import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import HomeScreen from '../index';

// The home tab simply renders the main index screen
export default function HomeTab() {
  return <HomeScreen />;
}
