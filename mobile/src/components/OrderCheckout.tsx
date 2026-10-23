import React, { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, ui, Feedback } from './Screen';
import Button from './ui/Button';
import Input from './ui/Input';
import { useCartStore } from '../stores/cart-store';
import { useAuthStore } from '../stores/auth-store';
import { api } from '../lib/api';
import { formatMoney } from '../lib/money';
import { useMarketStore } from '../stores/market-store';

export default function OrderCheckout() {
  const cart = useCartStore(); const user = useAuthStore(s => s.user); const router = useRouter(); const currency = useMarketStore(s => s.currencyCode());
  const [address, setAddress] = useState(''); const [notes, setNotes] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [order, setOrder] = useState<any>(null); const inFlight = useRef(false);
  async function submit() {
    if (!user) { router.push('/(auth)/login'); return; } if (inFlight.current) return; inFlight.current = true; setBusy(true); setError('');
    try {
      if (!cart.items.length || !cart.businessId) throw new Error('Your basket is empty.');
      if (cart.items.some(i => i.type === 'booking')) throw new Error('Request service bookings from the business page.');
      const businessIds = cart.items.map(i => i.type === 'menu' ? i.item.businessId : i.type === 'product' ? i.product.businessId : i.service.businessId);
      if (businessIds.some(id => id !== cart.businessId)) throw new Error('Place a separate order for each business. Remove items from other businesses.');
      const result = await api.post<any>('/api/order', { businessId: cart.businessId,
        items: cart.items.map(i => i.type === 'menu' ? { menuItemId: i.item.id, quantity: i.quantity, notes: i.notes } : i.type === 'product' ? { productId: i.product.id, quantity: i.quantity, notes: i.notes } : null),
        deliveryAddress: address.trim() ? { formatted: address.trim() } : {}, notes,
      });
      if (!result.id) throw new Error('The order could not be confirmed. Check your activity before trying again.');
      setOrder(result); cart.clearCart();
    } catch (e) { setError((e as Error).message); } finally { inFlight.current = false; setBusy(false); }
  }
  if (order) return <Screen title="Order received"><Text style={ui.success}>Your order has been saved.</Text><Text style={ui.title}>{"Good things\nare on their way."}</Text><Text selectable style={ui.body}>Reference: {order.id}</Text><Text style={ui.body}>Order status: {order.status}. Payment: {order.payment_status}. The business will confirm fulfilment and payment arrangements.</Text><Text style={ui.title}>{formatMoney(Number(order.total), order.currency)}</Text><Button title="View my orders" onPress={() => router.replace('/(tabs)/bookings')} /></Screen>;
  return <Screen title="Your basket"><Text style={ui.title}>{"A little something\nfor your day."}</Text>
    {!cart.items.length ? <><Feedback empty="Your basket is empty. Discover something local to get started." /><Button title="Explore restaurants" onPress={() => router.replace('/food')} /></> : <>
    {cart.items.map((i, index) => <View key={index} style={ui.panel}><Text style={{ fontWeight: '700' }}>{i.type === 'menu' ? i.item.name : i.type === 'product' ? i.product.name : i.service.name} × {i.quantity}</Text><Button title="Remove" variant="ghost" onPress={() => cart.removeItem(index)} disabled={busy} /></View>)}
    <Text style={ui.body}>Item subtotal · {formatMoney(cart.subtotal(), currency)}. The server validates prices, fees and availability when you submit.</Text>
    <Input label="Delivery address (leave blank for pickup)" value={address} onChangeText={setAddress} multiline /><Input label="Notes for the business" value={notes} onChangeText={setNotes} multiline />
    <Text style={ui.body}>This submits an unpaid order. No card is charged. Online payment will be available after the payment integration is configured and verified.</Text>
    <Feedback error={error} /><Button title="Submit order" loading={busy} onPress={submit} fullWidth />
    </>}
  </Screen>;
}
