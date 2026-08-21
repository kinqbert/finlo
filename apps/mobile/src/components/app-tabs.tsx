import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Palette } from '@/constants/theme';

export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor={Palette.paper}
      indicatorColor="#E8EFE6"
      labelStyle={{ selected: { color: Palette.green }, default: { color: Palette.muted } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'house', selected: 'house.fill' }}
          md={{ default: 'home', selected: 'home_filled' }}
          selectedColor={Palette.green}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Activity</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'list.bullet.rectangle', selected: 'list.bullet.rectangle.fill' }}
          md={{ default: 'receipt_long', selected: 'receipt_long' }}
          selectedColor={Palette.green}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
