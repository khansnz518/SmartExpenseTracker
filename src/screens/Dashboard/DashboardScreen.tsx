import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { 
  Text, 
  Card, 
  Avatar, 
  Button, 
  useTheme, 
  FAB, 
  Portal, 
  Dialog, 
  TextInput 
} from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { loadTransactions, setUserName } from '../../store/expenseSlice';
import { PieChart } from 'react-native-gifted-charts';
import { syncSmsToTransactions } from '../../services/smsService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
};

const CHART_COLORS = ['#E53935', '#FB8C00', '#1E88E5', '#43A047', '#8E24AA', '#00ACC1'];

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  
  const { transactions, status, userName } = useSelector((state: RootState) => state.expenses);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [tempName, setTempName] = useState(userName);

  const currentDate = new Date();
  const currentMonthYear = currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  useEffect(() => {
    if (status === 'idle') {
      dispatch(loadTransactions());
    }

    const loadUserName = async () => {
        try {
            const savedName = await AsyncStorage.getItem('userName');
            if (savedName) {
                dispatch(setUserName(savedName));
            }
        } catch (e) {
            console.log("Error loading name", e);
        }
    };
    loadUserName();

    const runSmsSync = async () => {
        await syncSmsToTransactions();
    };
    runSmsSync();

  }, [status, dispatch]);

  const saveName = () => {
    dispatch(setUserName(tempName));
    setIsDialogVisible(false);
  };

  const income = transactions
    .filter(t => t.type === 'CREDIT')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const expense = transactions
    .filter(t => t.type === 'DEBIT')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = income - expense;
  const recentTransactions = transactions.slice(0, 5);

  const pieData = useMemo(() => {
    const expensesOnly = transactions.filter(t => t.type === 'DEBIT');
    if (expensesOnly.length === 0) return [];

    const categoryTotals: Record<string, number> = {};
    expensesOnly.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    const totalExpense = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

    return Object.keys(categoryTotals).map((cat, index) => ({
      value: categoryTotals[cat],
      color: CHART_COLORS[index % CHART_COLORS.length],
      text: totalExpense > 0 ? `${Math.round((categoryTotals[cat] / totalExpense) * 100)}%` : '',
      legend: cat
    }));
  }, [transactions]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
            <View>
                <Text variant="titleMedium" style={{ color: theme.colors.outline }}>Welcome Back,</Text>
                <TouchableOpacity onPress={() => { setTempName(userName); setIsDialogVisible(true); }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginRight: 8 }}>
                      {userName}
                    </Text>
                    <Avatar.Icon icon="pencil" size={24} style={{ backgroundColor: theme.colors.elevation.level2 }} />
                  </View>
                </TouchableOpacity>
            </View>
            <Button mode="outlined" compact icon="calendar" style={{ borderColor: theme.colors.outline }}>
              {currentMonthYear}
            </Button>
        </View>

        <Card style={[styles.balanceCard, { backgroundColor: theme.colors.primary }]}>
            <Card.Content>
                <Text variant="labelLarge" style={{ color: 'rgba(255,255,255,0.8)' }}>Total Balance</Text>
                <Text variant="displaySmall" style={{ color: '#fff', fontWeight: 'bold', marginVertical: 8 }}>
                    ₹ {balance.toLocaleString()}
                </Text>
                <View style={styles.expenseRow}>
                    <View>
                        <Text variant="labelMedium" style={{ color: 'rgba(255,255,255,0.7)' }}>Income</Text>
                        <Text variant="titleMedium" style={{ color: '#fff' }}>₹ {income}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View>
                        <Text variant="labelMedium" style={{ color: 'rgba(255,255,255,0.7)' }}>Expenses</Text>
                        <Text variant="titleMedium" style={{ color: '#FFC107' }}>₹ {expense}</Text>
                    </View>
                </View>
            </Card.Content>
        </Card>

        <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Spending Breakdown</Text>
            <Card style={styles.chartCard}>
                <Card.Content>
                    {pieData.length > 0 ? (
                        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
                             <PieChart
                                data={pieData}
                                donut
                                radius={60}
                                innerRadius={40}
                                showText
                                textColor="white"
                                textSize={10}
                            />
                            <View style={{ flex: 1, marginLeft: 20 }}>
                                {pieData.map((item, idx) => (
                                    <View key={idx} style={{flexDirection:'row', alignItems:'center', marginBottom:4}}>
                                        <View style={{width:10, height:10, backgroundColor:item.color, borderRadius:5, marginRight:8}} />
                                        <Text variant="bodySmall" numberOfLines={1}>{item.legend}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ) : (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text variant="bodyMedium" style={{ color: '#888' }}>No expenses to show yet.</Text>
                        </View>
                    )}
                </Card.Content>
            </Card>
        </View>

        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Recent Transactions</Text>
                <Button 
                    mode="text" 
                    compact 
                    onPress={() => navigation.navigate('TransactionHistory')}
                >
                    See All
                </Button>
            </View>
            
            {recentTransactions.length === 0 ? (
                 <Text style={{ textAlign: 'center', marginTop: 10, color: '#888' }}>No transactions found.</Text>
            ) : (
                recentTransactions.map((item) => (
                    <Card key={item.id} style={styles.transactionCard}>
                        <Card.Title
                            title={item.notes || item.category}
                            titleStyle={{ fontWeight: '600' }}
                            subtitle={
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                                    <View style={[
                                        styles.sourceBadge, 
                                        { backgroundColor: item.source === 'SMS' ? '#E3F2FD' : '#F5F5F5' }
                                    ]}>
                                        <Text style={{ 
                                            fontSize: 9, 
                                            fontWeight: 'bold', 
                                            color: item.source === 'SMS' ? '#1976D2' : '#616161' 
                                        }}>
                                            {item.source === 'SMS' ? 'SMS' : 'MANUAL'}
                                        </Text>
                                    </View>
                                    <Text variant="bodySmall" style={{ color: '#888', marginLeft: 6 }}>
                                        {item.date}
                                    </Text>
                                </View>
                            }
                            left={(props) => <Avatar.Icon {...props} icon="currency-inr" size={40} style={{ backgroundColor: '#eee' }} />}
                            right={() => (
                                <Text style={{ 
                                    marginRight: 16, 
                                    fontWeight:'bold', 
                                    color: item.type === 'DEBIT' ? theme.colors.error : theme.colors.primary 
                                }}>
                                    {item.type === 'DEBIT' ? '-' : '+'} ₹{item.amount}
                                </Text>
                            )}
                        />
                    </Card>
                ))
            )}
        </View>

        {/* 3. ADD EXTRA PADDING AT BOTTOM OF SCROLLVIEW SO FAB DOESN'T COVER CONTENT */}
        <View style={{ height: 100 }} /> 
      </ScrollView>

      <Portal>
        <Dialog visible={isDialogVisible} onDismiss={() => setIsDialogVisible(false)}>
          <Dialog.Title>Edit Name</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Enter your name"
              value={tempName}
              onChangeText={setTempName}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setIsDialogVisible(false)}>Cancel</Button>
            <Button onPress={saveName}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <FAB
        icon="plus"
        style={[
          styles.fab, 
          { 
            backgroundColor: theme.colors.secondary,
            bottom: insets.bottom 
          }
        ]}
        color="black"
        label="Add Expense"
        onPress={() => navigation.navigate('AddExpense')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollContent: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  balanceCard: { marginBottom: 24, borderRadius: 16 },
  expenseRow: { flexDirection: 'row', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  divider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 24 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontWeight: 'bold' },
  chartCard: { backgroundColor: '#fff', paddingVertical: 10 },
  transactionCard: { marginBottom: 8, backgroundColor: '#fff' },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0 },
  sourceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
});

export default DashboardScreen;