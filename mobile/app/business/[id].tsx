import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
export default function Business(){const {id}=useLocalSearchParams<{id:string}>();return <Redirect href={{pathname:'/marketplace/[kind]/[id]',params:{kind:'services',id}}} />;}
