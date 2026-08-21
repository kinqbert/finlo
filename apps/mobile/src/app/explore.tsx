import { useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset, Palette } from '@/constants/theme';
import { formatMoney, formatShortDate } from '@/lib/format';
import { useSession } from '@/lib/session';
import type { Transaction } from '@/lib/types';

const expenseCategories = ['Groceries', 'Dining', 'Transport', 'Health', 'Subscriptions', 'Other'];
const incomeCategories = ['Salary', 'Freelance', 'Gift', 'Other'];

export default function ActivityScreen() {
  const session = useSession();
  const params = useLocalSearchParams<{ add?: string }>();
  const [filter, setFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [modalOpen, setModalOpen] = useState(params.add === 'expense' || params.add === 'income');
  const initialType: Transaction['type'] = params.add === 'income' ? 'income' : 'expense';

  const transactions = useMemo(() => filter === 'all' ? session.data.transactions : session.data.transactions.filter((item) => item.type === filter), [filter, session.data.transactions]);

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}><View><Text style={styles.eyebrow}>MONEY IN MOTION</Text><Text style={styles.title}>Accounts &{`\n`}activity</Text><Text style={styles.subtitle}>Every balance and transaction, together.</Text></View><Pressable style={styles.addTop} onPress={() => setModalOpen(true)}><SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} size={19} tintColor="#FFFFFF" /></Pressable></View>

        <Text style={styles.sectionTitle}>Your accounts</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.accounts}>{session.data.accounts.map((account, index) => <View key={account.id} style={[styles.accountCard, index === 0 && styles.accountCardDark]}><View style={[styles.accountIcon, index === 0 && styles.accountIconDark]}><SymbolView name={{ ios: account.type === 'cash' ? 'banknote' : account.type === 'savings' ? 'target' : 'creditcard', android: account.type === 'cash' ? 'payments' : account.type === 'savings' ? 'savings' : 'credit_card', web: 'credit_card' }} size={18} tintColor={index === 0 ? Palette.lime : Palette.green} /></View><Text style={[styles.accountName, index === 0 && styles.lightText]} numberOfLines={1}>{account.name}</Text><Text style={[styles.accountBalance, index === 0 && styles.lightText]}>{formatMoney(account.balance_minor, account.currency)}</Text><Text style={[styles.accountType, index === 0 && styles.dimLight]}>{account.type.toUpperCase()} · {account.currency}</Text></View>)}</ScrollView>

        <View style={styles.listHeader}><Text style={styles.sectionTitle}>Transactions</Text><View style={styles.filters}>{(['all', 'expense', 'income'] as const).map((value) => <Pressable key={value} style={[styles.filter, filter === value && styles.filterActive]} onPress={() => setFilter(value)}><Text style={[styles.filterText, filter === value && styles.filterTextActive]}>{value === 'all' ? 'All' : value === 'expense' ? 'Spent' : 'Income'}</Text></Pressable>)}</View></View>
        <View style={styles.list}>{transactions.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} />)}{transactions.length === 0 && <Text style={styles.empty}>No transactions yet.</Text>}</View>
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => setModalOpen(true)}><SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} size={21} tintColor="#FFFFFF" /><Text style={styles.fabText}>Add transaction</Text></Pressable>
      <TransactionModal key={`${initialType}-${modalOpen}`} visible={modalOpen} initialType={initialType} onClose={() => setModalOpen(false)} />
    </SafeAreaView>
  );
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  return <View style={styles.transaction}><View style={styles.transactionIcon}><SymbolView name={{ ios: transaction.type === 'expense' ? 'arrow.up.right' : 'arrow.down.left', android: transaction.type === 'expense' ? 'north_east' : 'south_west', web: 'swap_vert' }} size={15} tintColor={Palette.green} /></View><View style={styles.transactionMain}><Text style={styles.transactionTitle} numberOfLines={1}>{transaction.description || transaction.category}</Text><Text style={styles.transactionMeta}>{transaction.category} · {formatShortDate(transaction.occurred_at)}</Text></View><Text style={[styles.transactionAmount, transaction.type === 'income' && styles.income]}>{transaction.type === 'expense' ? '−' : '+'}{formatMoney(transaction.amount_minor, transaction.currency)}</Text></View>;
}

function TransactionModal({ visible, initialType, onClose }: { visible: boolean; initialType: Transaction['type']; onClose: () => void }) {
  const session = useSession();
  const [type, setType] = useState<Transaction['type']>(initialType);
  const [accountID, setAccountID] = useState(session.data.accounts[0]?.id ?? '');
  const [category, setCategory] = useState('Groceries');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const categories = type === 'expense' ? expenseCategories : incomeCategories;

  async function submit() {
    const amountMinor = Math.round(Number(amount.replace(',', '.')) * 100);
    if (!accountID || !Number.isFinite(amountMinor) || amountMinor <= 0) return;
    setBusy(true);
    try {
      await session.addTransaction({ account_id: accountID, type, amount_minor: amountMinor, category, description: note.trim() });
      setAmount('');
      setNote('');
      onClose();
    } finally { setBusy(false); }
  }

  return <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}><KeyboardAvoidingView style={styles.modalPage} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><SafeAreaView style={styles.modalSafe}><View style={styles.modalHeader}><Pressable onPress={onClose}><Text style={styles.cancel}>Cancel</Text></Pressable><Text style={styles.modalTitle}>Add transaction</Text><Pressable onPress={submit} disabled={busy}><Text style={styles.save}>{busy ? 'Saving' : 'Save'}</Text></Pressable></View><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalContent}><View style={styles.typeToggle}><Pressable style={[styles.typeButton, type === 'expense' && styles.typeActive]} onPress={() => { setType('expense'); setCategory('Groceries'); }}><Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>Expense</Text></Pressable><Pressable style={[styles.typeButton, type === 'income' && styles.typeActive]} onPress={() => { setType('income'); setCategory('Salary'); }}><Text style={[styles.typeText, type === 'income' && styles.typeTextActive]}>Income</Text></Pressable></View><Text style={styles.inputLabel}>AMOUNT</Text><View style={styles.amountInput}><Text style={styles.currency}>₴</Text><TextInput value={amount} onChangeText={setAmount} autoFocus keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor="#B1B8B3" style={styles.amountText} /></View><Text style={styles.inputLabel}>ACCOUNT</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{session.data.accounts.map((account) => <Pressable key={account.id} style={[styles.chip, accountID === account.id && styles.chipActive]} onPress={() => setAccountID(account.id)}><Text style={[styles.chipText, accountID === account.id && styles.chipTextActive]}>{account.name}</Text></Pressable>)}</ScrollView><Text style={styles.inputLabel}>CATEGORY</Text><View style={styles.chips}>{categories.map((item) => <Pressable key={item} style={[styles.chip, category === item && styles.chipActive]} onPress={() => setCategory(item)}><Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text></Pressable>)}</View><Text style={styles.inputLabel}>NOTE</Text><TextInput value={note} onChangeText={setNote} placeholder="What was this for?" placeholderTextColor="#9AA39D" style={styles.noteInput} /><Pressable style={[styles.submitButton, (!amount || busy) && styles.disabled]} disabled={!amount || busy} onPress={submit}><Text style={styles.submitText}>{busy ? 'Saving…' : `Add ${type}`}</Text></Pressable></ScrollView></SafeAreaView></KeyboardAvoidingView></Modal>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Palette.canvas },
  content: { paddingTop: 18, paddingBottom: BottomTabInset + 90 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18 },
  eyebrow: { color: Palette.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  title: { color: Palette.ink, fontSize: 34, lineHeight: 38, fontWeight: '800', letterSpacing: -1.3, marginTop: 8 },
  subtitle: { color: Palette.muted, fontSize: 11, marginTop: 8 },
  addTop: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: Palette.green },
  sectionTitle: { color: Palette.ink, fontSize: 16, fontWeight: '800', letterSpacing: -.3, marginTop: 29, marginHorizontal: 18, marginBottom: 11 },
  accounts: { gap: 11, paddingHorizontal: 18 },
  accountCard: { width: 215, padding: 18, borderWidth: 1, borderColor: Palette.line, borderRadius: 20, backgroundColor: Palette.paper },
  accountCardDark: { backgroundColor: Palette.green, borderColor: Palette.green },
  accountIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#EDF2E9' },
  accountIconDark: { backgroundColor: 'rgba(255,255,255,0.1)' },
  accountName: { color: Palette.muted, fontSize: 10, marginTop: 22 },
  accountBalance: { color: Palette.ink, fontSize: 21, fontWeight: '800', marginTop: 5 },
  accountType: { color: '#99A39D', fontSize: 8, marginTop: 5 },
  lightText: { color: '#FFFFFF' },
  dimLight: { color: 'rgba(255,255,255,0.48)' },
  listHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingRight: 18 },
  filters: { flexDirection: 'row', gap: 3, padding: 3, borderRadius: 10, backgroundColor: '#E9ECE5' },
  filter: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 7 },
  filterActive: { backgroundColor: '#FFFFFF' },
  filterText: { color: Palette.muted, fontSize: 9, fontWeight: '700' },
  filterTextActive: { color: Palette.ink },
  list: { marginHorizontal: 18, paddingHorizontal: 15, borderWidth: 1, borderColor: Palette.line, borderRadius: 20, backgroundColor: Palette.paper },
  transaction: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: '#EDF0E9' },
  transactionIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#F0F3EC' },
  transactionMain: { flex: 1 },
  transactionTitle: { color: Palette.ink, fontSize: 11, fontWeight: '700' },
  transactionMeta: { color: Palette.muted, fontSize: 9, marginTop: 4 },
  transactionAmount: { color: '#A85845', fontSize: 11, fontWeight: '800' },
  income: { color: '#347051' },
  empty: { padding: 30, color: Palette.muted, fontSize: 11, textAlign: 'center' },
  fab: { position: 'absolute', right: 18, bottom: BottomTabInset + 17, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 17, height: 48, borderRadius: 16, backgroundColor: Palette.green },
  fabText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  modalPage: { flex: 1, backgroundColor: Palette.canvas },
  modalSafe: { flex: 1 },
  modalHeader: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: Palette.line },
  cancel: { color: Palette.muted, fontSize: 12, fontWeight: '600' },
  save: { color: Palette.green, fontSize: 12, fontWeight: '800' },
  modalTitle: { color: Palette.ink, fontSize: 14, fontWeight: '800' },
  modalContent: { padding: 20, paddingBottom: 50 },
  typeToggle: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 13, backgroundColor: '#E9ECE5', marginBottom: 28 },
  typeButton: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  typeActive: { backgroundColor: Palette.paper },
  typeText: { color: Palette.muted, fontSize: 11, fontWeight: '700' },
  typeTextActive: { color: Palette.ink },
  inputLabel: { color: Palette.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1, marginTop: 20, marginBottom: 9 },
  amountInput: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Palette.line, paddingBottom: 8 },
  currency: { color: Palette.green, fontSize: 31, fontWeight: '800' },
  amountText: { flex: 1, color: Palette.ink, fontSize: 40, fontWeight: '800', letterSpacing: -1.5, paddingVertical: 0 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: Palette.line, borderRadius: 11, backgroundColor: Palette.paper },
  chipActive: { borderColor: Palette.green, backgroundColor: Palette.green },
  chipText: { color: Palette.muted, fontSize: 10, fontWeight: '700' },
  chipTextActive: { color: '#FFFFFF' },
  noteInput: { height: 48, paddingHorizontal: 13, borderWidth: 1, borderColor: Palette.line, borderRadius: 12, backgroundColor: Palette.paper, color: Palette.ink, fontSize: 12 },
  submitButton: { height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 28, borderRadius: 14, backgroundColor: Palette.green },
  submitText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  disabled: { opacity: .5 },
});
