import { Tabs } from 'expo-router';  
import React from 'react';  
import { HapticTab } from '@/components/haptic-tab';  
import { IconSymbol } from '@/components/ui/icon-symbol';  
  
export default function TabLayout() {  
  return (  
    <Tabs screenOptions={{ headerShown: false, tabBarButton: HapticTab, tabBarStyle: { backgroundColor: '#0f0f10', borderTopColor: '#2a2a2c' }, tabBarActiveTintColor: '#ef4444', tabBarInactiveTintColor: '#a3a3a3' }}>  
      <Tabs.Screen name='index' options={{ title: 'Inicio', tabBarIcon: ({ color }) => <IconSymbol size={26} name='house.fill' color={color} /> }} />  
      <Tabs.Screen name='market' options={{ title: 'Mercado', tabBarIcon: ({ color }) => <IconSymbol size={26} name='chart.bar.fill' color={color} /> }} />  
      <Tabs.Screen name='lineup' options={{ title: 'Escalacao', tabBarIcon: ({ color }) => <IconSymbol size={26} name='person.3.fill' color={color} /> }} />  
      <Tabs.Screen name='leagues' options={{ title: 'Ligas', tabBarIcon: ({ color }) => <IconSymbol size={26} name='rosette' color={color} /> }} />  
      <Tabs.Screen name='profile' options={{ title: 'Perfil', tabBarIcon: ({ color }) => <IconSymbol size={26} name='person.fill' color={color} /> }} />  
    </Tabs>  
  );  
} 
