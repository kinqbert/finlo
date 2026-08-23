import { router } from 'expo-router';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset, Palette } from '@/constants/theme';
import { formatMoney, formatShortDate } from '@/lib/format';
import { useSession } from '@/lib/session';
import type { Budget, Transaction } from '@/lib/types';

export default function HomeScreen() {
  const session = useSession();
  const { data, user } = session;
  const balance = data.dashboard.balances[0] ?? { currency: 'UAH', balance_minor: 0 };
  const income = data.transactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount_minor, 0);
  const spending = data.transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount_minor, 0);
  const savingsRate = income > 0 ? Math.max(0, Math.round(((income - spending) / income) * 100)) : 0;

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={session.refreshing} onRefresh={() => void session.refresh()} tintColor={Palette.green} />}>
        <View style={styles.header}>
          <View><Text style={styles.eyebrow}>{new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase()}</Text><Text style={styles.title}>Good morning,{`\n`}{user.name}.</Text></View>
          <Pressable style={styles.avatar} onPress={() => session.logout()}><Text style={styles.avatarText}>{`${user.name[0] ?? ''}${user.surname[0] ?? ''}`}</Text></Pressable>
        </View>

        {session.status === 'demo' && <View style={styles.demoPill}><Text style={styles.demoPillText}>DEMO MODE · TAP AVATAR TO EXIT</Text></View>}

        <View style={styles.balanceCard}>
          <View style={styles.balanceTop}><Text style={styles.balanceLabel}>TOTAL BALANCE</Text><AppIcon ios="ellipsis" android="more_horiz" size={20} color="rgba(255,255,255,0.75)" /></View>
          <Text style={styles.balanceValue}>{formatMoney(balance.balance_minor, balance.currency)}</Text>
          <Text style={styles.balanceChange}>↗ 8.4%  <Text style={styles.balanceMuted}>from last month</Text></Text>
          <View style={styles.accountStrip}>{data.accounts.slice(0, 3).map((account, index) => <View style={styles.accountLine} key={account.id}><View style={[styles.dot, index === 1 && styles.dotPeach, index === 2 && styles.dotLilac]} /><Text numberOfLines={1} style={styles.accountName}>{account.name}</Text><Text style={styles.accountAmount}>{formatMoney(account.balance_minor, account.currency, true)}</Text></View>)}</View>
        </View>

        <View style={styles.quickActions}>
          <QuickAction label="Add expense" icon="minus" onPress={() => router.push('/explore?add=expense')} />
          <QuickAction label="Add income" icon="plus" onPress={() => router.push('/explore?add=income')} />
          <QuickAction label="Accounts" icon="creditcard" onPress={() => router.push('/explore')} />
        </View>

        <View style={styles.metrics}>
          <Metric label="INCOME" value={formatMoney(income, 'UAH', true)} color={Palette.mint} icon="arrow.down.left" />
          <Metric label="SPENT" value={formatMoney(spending, 'UAH', true)} color={Palette.peach} icon="arrow.up.right" />
          <Metric label="SAVING" value={`${savingsRate}%`} color={Palette.lilac} icon="target" />
        </View>

        <View style={styles.insightCard}>
          <View style={styles.insightIcon}><AppIcon ios="sparkles" android="auto_awesome" size={19} color={Palette.green} /></View>
          <Text style={styles.insightEyebrow}>FINLO INSIGHT</Text>
          <Text style={styles.insightTitle}>{data.dashboard.insights[0]?.title ?? 'Your finances look calm'}</Text>
          <Text style={styles.insightText}>{data.dashboard.insights[0]?.message ?? 'Add a budget to start receiving proactive guidance.'}</Text>
        </View>

        <SectionHeader title="Budget pace" action="This month" />
        <View style={styles.card}>{data.budgets.map((budget) => <BudgetLine key={budget.id} budget={budget} />)}</View>

        <SectionHeader title="Recent activity" action="See all" onPress={() => router.push('/explore')} />
        <View style={styles.card}>{data.transactions.slice(0, 5).map((transaction) => <TransactionLine key={transaction.id} transaction={transaction} />)}</View>

        {data.dashboard.emergency_fund && <><SectionHeader title="Emergency fund" action="Safety net" /><View style={styles.goalCard}><View style={styles.goalTop}><View><Text style={styles.goalValue}>{formatMoney(data.dashboard.emergency_fund.current_minor, data.dashboard.emergency_fund.currency)}</Text><Text style={styles.goalCaption}>of {formatMoney(data.dashboard.emergency_fund.target_minor, data.dashboard.emergency_fund.currency)}</Text></View><Text style={styles.goalPercent}>{Math.round((data.dashboard.emergency_fund.current_minor / data.dashboard.emergency_fund.target_minor) * 100)}%</Text></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.min(100, (data.dashboard.emergency_fund.current_minor / data.dashboard.emergency_fund.target_minor) * 100)}%` }]} /></View></View></>}
      </ScrollView>
    </SafeAreaView>
  );
}

function AppIcon({ ios, android, size = 18, color = Palette.ink }: { ios: SFSymbol; android: AndroidSymbol; size?: number; color?: string }) {
  return <SymbolView name={{ ios, android, web: android }} size={size} tintColor={color} />;
}

function QuickAction({ label, icon, onPress }: { label: string; icon: SFSymbol; onPress: () => void }) {
  return <Pressable style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]} onPress={onPress}><View style={styles.quickIcon}><AppIcon ios={icon} android={icon === 'creditcard' ? 'credit_card' : icon === 'plus' ? 'add' : 'remove'} size={18} color={Palette.green} /></View><Text style={styles.quickLabel}>{label}</Text></Pressable>;
}

function Metric({ label, value, color, icon }: { label: string; value: string; color: string; icon: SFSymbol }) {
  return <View style={styles.metric}><View style={[styles.metricIcon, { backgroundColor: color }]}><AppIcon ios={icon} android="trending_up" size={14} /></View><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>;
}

function SectionHeader({ title, action, onPress }: { title: string; action: string; onPress?: () => void }) {
  return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text><Pressable onPress={onPress}><Text style={styles.sectionAction}>{action}  ›</Text></Pressable></View>;
}

function BudgetLine({ budget }: { budget: Budget }) {
  const spent = budget.spent_minor ?? 0;
  const percent = Math.min(100, Math.round((spent / budget.amount_minor) * 100));
  return <View style={styles.budgetLine}><View style={styles.categoryIcon}><Text>{budget.category === 'Groceries' ? '🛒' : budget.category === 'Dining' ? '🍽' : '🚕'}</Text></View><View style={styles.budgetMain}><View style={styles.budgetLabels}><Text style={styles.rowTitle}>{budget.category}</Text><Text style={styles.rowMeta}>{formatMoney(spent, budget.currency, true)} / {formatMoney(budget.amount_minor, budget.currency, true)}</Text></View><View style={styles.progressTrack}><View style={[styles.progressFill, percent > 75 && styles.progressWarn, { width: `${percent}%` }]} /></View></View><Text style={styles.budgetPercent}>{percent}%</Text></View>;
}

export function TransactionLine({ transaction }: { transaction: Transaction }) {
  return <View style={styles.transactionLine}><View style={styles.categoryIcon}><AppIcon ios={transaction.type === 'expense' ? 'arrow.up.right' : 'arrow.down.left'} android={transaction.type === 'expense' ? 'north_east' : 'south_west'} size={15} color={Palette.green} /></View><View style={styles.transactionMain}><Text style={styles.rowTitle} numberOfLines={1}>{transaction.description || transaction.category}</Text><Text style={styles.rowMeta}>{transaction.category} · {formatShortDate(transaction.occurred_at)}</Text></View><Text style={[styles.transactionAmount, transaction.type === 'income' && styles.income]}>{transaction.type === 'expense' ? '−' : '+'}{formatMoney(transaction.amount_minor, transaction.currency)}</Text></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Palette.canvas },
  content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: BottomTabInset + 38 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  eyebrow: { color: Palette.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  title: { color: Palette.ink, fontSize: 34, lineHeight: 38, fontWeight: '800', letterSpacing: -1.3, marginTop: 8 },
  avatar: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: Palette.green },
  avatarText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  demoPill: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, marginTop: 13, borderRadius: 20, backgroundColor: '#E6EED4' },
  demoPillText: { color: '#59702C', fontSize: 8, fontWeight: '800', letterSpacing: .5 },
  balanceCard: { marginTop: 24, padding: 23, borderRadius: 24, backgroundColor: Palette.green },
  balanceTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balanceLabel: { color: 'rgba(255,255,255,0.58)', fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  balanceValue: { color: '#FFFFFF', fontSize: 36, fontWeight: '800', letterSpacing: -1.3, marginTop: 19 },
  balanceChange: { color: Palette.lime, fontSize: 10, fontWeight: '700', marginTop: 7 },
  balanceMuted: { color: 'rgba(255,255,255,0.52)', fontWeight: '500' },
  accountStrip: { gap: 10, marginTop: 23, paddingTop: 17, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)' },
  accountLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Palette.lime },
  dotPeach: { backgroundColor: '#ECBA9E' },
  dotLilac: { backgroundColor: '#A9A8E8' },
  accountName: { flex: 1, color: 'rgba(255,255,255,0.62)', fontSize: 10 },
  accountAmount: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  quickActions: { flexDirection: 'row', gap: 9, marginTop: 12 },
  quickAction: { flex: 1, alignItems: 'center', gap: 7, paddingVertical: 13, borderWidth: 1, borderColor: Palette.line, borderRadius: 16, backgroundColor: Palette.paper },
  quickIcon: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#EDF2E9' },
  quickLabel: { color: Palette.ink, fontSize: 9, fontWeight: '700' },
  pressed: { opacity: .65 },
  metrics: { flexDirection: 'row', gap: 9, marginTop: 12 },
  metric: { flex: 1, padding: 13, borderWidth: 1, borderColor: Palette.line, borderRadius: 17, backgroundColor: Palette.paper },
  metricIcon: { width: 27, height: 27, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  metricLabel: { color: Palette.muted, fontSize: 8, fontWeight: '800', letterSpacing: .7, marginTop: 11 },
  metricValue: { color: Palette.ink, fontSize: 15, fontWeight: '800', marginTop: 4 },
  insightCard: { overflow: 'hidden', marginTop: 12, padding: 21, borderRadius: 21, backgroundColor: '#345C47' },
  insightIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: Palette.lime },
  insightEyebrow: { color: '#BBD194', fontSize: 8, fontWeight: '800', letterSpacing: 1, marginTop: 20 },
  insightTitle: { color: '#FFFFFF', fontSize: 19, lineHeight: 23, fontWeight: '800', marginTop: 8 },
  insightText: { color: 'rgba(255,255,255,0.66)', fontSize: 11, lineHeight: 17, marginTop: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 29, marginBottom: 11, paddingHorizontal: 2 },
  sectionTitle: { color: Palette.ink, fontSize: 16, fontWeight: '800', letterSpacing: -.3 },
  sectionAction: { color: '#52715E', fontSize: 10, fontWeight: '700' },
  card: { paddingHorizontal: 16, borderWidth: 1, borderColor: Palette.line, borderRadius: 20, backgroundColor: Palette.paper },
  budgetLine: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#EDF0E9' },
  categoryIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#F1F3ED' },
  budgetMain: { flex: 1, gap: 8 },
  budgetLabels: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  rowTitle: { color: Palette.ink, fontSize: 11, fontWeight: '700' },
  rowMeta: { color: Palette.muted, fontSize: 9, marginTop: 3 },
  progressTrack: { height: 5, overflow: 'hidden', borderRadius: 3, backgroundColor: '#E9EDE5' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: '#6DA278' },
  progressWarn: { backgroundColor: '#DA936D' },
  budgetPercent: { width: 30, color: Palette.muted, fontSize: 9, fontWeight: '700', textAlign: 'right' },
  transactionLine: { flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 65, borderBottomWidth: 1, borderBottomColor: '#EDF0E9' },
  transactionMain: { flex: 1 },
  transactionAmount: { color: '#A85845', fontSize: 11, fontWeight: '800' },
  income: { color: '#347051' },
  goalCard: { padding: 20, borderRadius: 20, backgroundColor: '#E9EEDC' },
  goalTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  goalValue: { color: Palette.green, fontSize: 24, fontWeight: '800', letterSpacing: -.5 },
  goalCaption: { color: Palette.muted, fontSize: 9, marginTop: 3 },
  goalPercent: { color: Palette.green, fontSize: 14, fontWeight: '800' },
});
