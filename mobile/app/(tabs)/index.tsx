import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CountryPicker from '../../src/components/CountryPicker';
import { COUNTRIES } from '../../src/constants/countries';
import { useMarketStore } from '../../src/stores/market-store';
import { api } from '../../src/lib/api';
import { imageSourceFor } from '../../src/lib/images';
import { formatMoney } from '../../src/lib/money';

interface Restaurant { id: string; name: string; cuisineType: string; rating: number; preparationTime: number; deliveryFee: number; currency: string; }
const categories: {label: string; icon: keyof typeof Ionicons.glyphMap; route: '/stays' | '/food' | '/ride' | '/events' | '/products' | '/delivery' | '/(tabs)/search'}[] = [
 {label:'Hotels',icon:'bed',route:'/stays'}, {label:'Restaurants',icon:'restaurant',route:'/food'},
 {label:'Services',icon:'construct',route:'/(tabs)/search'}, {label:'Products',icon:'bag',route:'/products'},
 {label:'Rides',icon:'car',route:'/ride'}, {label:'Delivery',icon:'bicycle',route:'/delivery'},
 {label:'Events',icon:'ticket',route:'/events'}, {label:'More',icon:'grid',route:'/(tabs)/search'},
];
const services = [
 {title:'Hair & beauty',image:require('../../assets/people/salon.jpg'),query:'Beauty'},
 {title:'Photography',image:require('../../assets/people/photography.jpg'),query:'Photography'},
 {title:'Home repair',image:require('../../assets/people/automotive.jpg'),query:'Home Services'},
];

export default function HomeScreen() {
 const router=useRouter();
 const countryCode=useMarketStore(s=>s.countryCode);
 const setCountry=useMarketStore(s=>s.setCountry);
 const country=COUNTRIES[countryCode] ?? COUNTRIES.NG;
 const [restaurants,setRestaurants]=useState<Restaurant[]>([]);
 const [loading,setLoading]=useState(true);
 const [refreshing,setRefreshing]=useState(false);
 const [error,setError]=useState(false);
 const request=useRef(0);
 const load=useCallback(async()=>{
  const version=++request.current; setError(false); setLoading(true);
  try { const result=await api.get<{data:{restaurants:Restaurant[]}}>(`/api/restaurants?liveOnly=1&country=${countryCode}`); if(version===request.current)setRestaurants((result.data?.restaurants ?? []).slice(0,6)); }
  catch { if(version===request.current){setRestaurants([]);setError(true);} }
  finally {if(version===request.current)setLoading(false);}
 },[countryCode]);
 useEffect(()=>{void load();return()=>{request.current++;};},[load]);
 return <SafeAreaView style={s.safe} edges={['top']}>
  <View style={s.header}>
   <View style={s.brand}><Ionicons name="layers" color="#BF5428" size={21}/><Text style={s.wordmark}>AfriBook</Text></View>
   <View style={s.country}><CountryPicker compact selectedCode={countryCode} onSelect={c=>setCountry(c.code)}/></View>
   <TouchableOpacity accessibilityRole="button" accessibilityLabel="Notifications" onPress={()=>router.push('/profile/notifications')} style={s.bell}><Ionicons name="notifications-outline" size={20} color="#302219"/></TouchableOpacity>
  </View>
  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} tintColor="#BF5428" onRefresh={async()=>{setRefreshing(true);await load();setRefreshing(false);}}/>}>
   <View style={s.hero}>
    <Image source={require('../../assets/editorial/city-life.jpg')} style={s.heroImage}/><View style={s.scrim}/>
    <Text style={s.headline}>Your city, all in{ '\n' }one place.</Text>
    <Text style={s.tagline}>Book. Order. Ride. Shop. Explore.</Text>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Search restaurants, hotels and services" onPress={()=>router.push('/(tabs)/search')} style={s.search}><Ionicons name="search" size={18} color="#302219"/><Text style={s.searchText}>Search for restaurants, hotels,{ '\n' }services, and more...</Text><View style={s.searchDivider}/><Ionicons name="options-outline" size={19} color="#302219"/></TouchableOpacity>
   </View>
   <View style={s.categories}>{categories.map(item=><TouchableOpacity key={item.label} style={s.category} accessibilityRole="button" onPress={()=>router.push(item.route)}><View style={s.iconTile}><Ionicons name={item.icon} size={24} color="#AE4A21"/></View><Text style={s.categoryText}>{item.label}</Text></TouchableOpacity>)}</View>
   <View style={s.section}>
    <View style={s.sectionHead}><Text style={s.sectionTitle}>Popular picks</Text><TouchableOpacity accessibilityRole="button" onPress={()=>router.push('/food')} style={s.seeAll}><Text style={s.seeAllText}>See all →</Text></TouchableOpacity></View>
    {loading?<ActivityIndicator style={s.empty} color="#BF5428"/>:restaurants.length?<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.rail}>{restaurants.map(r=><TouchableOpacity key={r.id} accessibilityRole="button" onPress={()=>router.push('/food')} style={s.pick}>
     <Image source={imageSourceFor(r.id,r.cuisineType,null,{width:420,ratio:.7})} style={s.pickImage}/>
     <View style={s.pickBody}><Text style={s.pickTitle} numberOfLines={1}>{r.name}</Text><Text style={s.meta} numberOfLines={1}>{r.cuisineType} · <Text style={s.star}>★</Text> {Number(r.rating).toFixed(1)}</Text><Text style={s.price}>{r.deliveryFee>0?`${formatMoney(r.deliveryFee,r.currency)} delivery`:'Free delivery'}</Text><Text style={s.meta}>{r.preparationTime} min preparation</Text></View>
    </TouchableOpacity>)}</ScrollView>:<View style={s.emptyCard}><Ionicons name="restaurant-outline" size={23} color="#BF5428"/><Text style={s.emptyText}>{error?'Could not load nearby restaurants. Pull down to retry.':`Discover new local businesses as they join AfriBook in ${country.name}.`}</Text></View>}
   </View>
   <View style={s.section}><View style={s.sectionHead}><Text style={s.sectionTitle}>Explore services</Text><TouchableOpacity accessibilityRole="button" onPress={()=>router.push('/(tabs)/search')} style={s.seeAll}><Text style={s.seeAllText}>See all →</Text></TouchableOpacity></View><View style={s.services}>{services.map(item=><TouchableOpacity key={item.title} accessibilityRole="button" style={s.service} onPress={()=>router.push({pathname:'/(tabs)/search',params:{category:item.query}})}><Image source={item.image} style={s.serviceImage}/><Text style={s.serviceTitle}>{item.title}</Text><Text style={s.meta}>Find a local professional</Text></TouchableOpacity>)}</View></View>
   <TouchableOpacity accessibilityRole="button" accessibilityLabel="Book a ride" style={s.ride} onPress={()=>router.push('/ride')}><Image source={require('../../assets/editorial/city-ride.jpg')} style={s.rideImage}/><View style={s.rideShade}/><Text style={s.rideTitle}>Need a ride?</Text><Text style={s.rideCopy}>Get there safely and on time.</Text><View style={s.rideButton}><Text style={s.rideButtonText}>Book a Ride</Text><Ionicons name="arrow-forward" size={12}/></View></TouchableOpacity>
  </ScrollView>
 </SafeAreaView>;
}
const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:'#FFFCF8'},content:{paddingBottom:28},
 header:{paddingHorizontal:16,height:64,flexDirection:'row',alignItems:'center',gap:8,backgroundColor:'#FFFCF8'},brand:{flexDirection:'row',alignItems:'center',gap:3},wordmark:{fontSize:21,fontWeight:'800',letterSpacing:-1,color:'#24170F'},country:{flex:1,alignItems:'flex-end'},bell:{width:36,height:44,alignItems:'center',justifyContent:'center'},
 hero:{height:222,justifyContent:'flex-end',padding:16,overflow:'hidden',backgroundColor:'#735331'},heroImage:{...StyleSheet.absoluteFillObject,width:'100%',height:'100%',resizeMode:'cover'},scrim:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(25,17,8,.26)'},headline:{fontSize:28,lineHeight:30,fontWeight:'800',letterSpacing:-1,color:'#fff',textShadowColor:'#0005',textShadowRadius:8,textShadowOffset:{width:0,height:2}},tagline:{fontSize:12,fontWeight:'500',color:'#fff',marginTop:8,marginBottom:14},search:{minHeight:54,flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:14,backgroundColor:'#fff',borderRadius:13,shadowColor:'#24170F',shadowOpacity:.1,shadowRadius:10,shadowOffset:{width:0,height:3},elevation:2},searchText:{flex:1,fontSize:11,lineHeight:15,color:'#65594E'},searchDivider:{height:24,width:1,backgroundColor:'#EEE7DF'},
 categories:{flexDirection:'row',flexWrap:'wrap',paddingHorizontal:14,paddingTop:19,paddingBottom:10,rowGap:15},category:{width:'25%',alignItems:'center',minHeight:70},iconTile:{height:46,width:49,borderRadius:15,alignItems:'center',justifyContent:'center',backgroundColor:'#FCF0E2'},categoryText:{fontSize:10,color:'#302219',marginTop:7,fontWeight:'500'},
 section:{marginTop:12,paddingHorizontal:16},sectionHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:6},sectionTitle:{fontSize:18,fontWeight:'700',letterSpacing:-.5,color:'#261B14'},seeAll:{minHeight:36,justifyContent:'center',paddingLeft:12},seeAllText:{fontSize:10,color:'#B64B22',fontWeight:'600'},rail:{gap:10,paddingBottom:3},pick:{width:150,borderRadius:10,overflow:'hidden',borderWidth:1,borderColor:'#EEE5DA',backgroundColor:'#fff'},pickImage:{height:105,width:'100%'},pickBody:{padding:8,gap:4},pickTitle:{fontSize:11,fontWeight:'600',color:'#2A1C15'},meta:{fontSize:9,lineHeight:13,color:'#786C61'},star:{color:'#C85B29'},price:{fontSize:12,fontWeight:'700',color:'#352419'},services:{flexDirection:'row',gap:9},service:{flex:1},serviceImage:{width:'100%',height:74,borderRadius:9},serviceTitle:{fontSize:10,fontWeight:'600',marginTop:7,marginBottom:3,color:'#302219'},
 ride:{height:111,marginHorizontal:16,marginTop:20,borderRadius:12,overflow:'hidden',padding:13,backgroundColor:'#76502E'},rideImage:{position:'absolute',right:0,top:-35,width:'82%',height:170,resizeMode:'cover'},rideShade:{...StyleSheet.absoluteFillObject,backgroundColor:'#2C1B1155'},rideTitle:{fontSize:17,fontWeight:'700',color:'#fff'},rideCopy:{fontSize:10,color:'#FFF6EA',marginTop:3},rideButton:{alignSelf:'flex-start',flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:13,minHeight:30,borderRadius:20,backgroundColor:'#FFFCF8',marginTop:9},rideButtonText:{fontSize:10,fontWeight:'600',color:'#302219'},empty:{padding:26},emptyCard:{padding:18,borderRadius:12,borderWidth:1,borderColor:'#EEE5DA',flexDirection:'row',alignItems:'center',gap:12},emptyText:{flex:1,fontSize:12,lineHeight:18,color:'#786C61'},
});
