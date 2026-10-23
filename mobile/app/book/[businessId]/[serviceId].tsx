import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
export default function Book(){const {businessId}=useLocalSearchParams<{businessId:string}>();return <Redirect href={{pathname:'/marketplace/[kind]/[id]',params:{kind:'services',id:businessId}}} />;}
