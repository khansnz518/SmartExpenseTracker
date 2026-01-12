import React, { useState, useMemo } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { 
  Text, 
  Card, 
  Avatar, 
  useTheme, 
  Searchbar, 
  Chip,
  Divider,
  IconButton
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { deleteTransaction, Transaction } from '../../store/expenseSlice'; 
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { AppDispatch } from '../../store/store';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TransactionHistory'>;
};

// Helper to format month safely
const formatMonth = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Unknown';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  } catch (e) {
    return 'Unknown';
  }
};

const TransactionHistoryScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  
  // 1. Get Transactions
  const expenseState = useSelector((state: RootState) => state.expenses);
  const transactions = expenseState?.transactions || [];

  // 2. Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBank, setSelectedBank] = useState('All');

  // 3. Extract Dynamic Filter Options
  const { uniqueMonths, uniqueCategories, uniqueBanks } = useMemo(() => {
    const months = new Set<string>(['All']);
    const cats = new Set<string>(['All']);
    const banks = new Set<string>(['All']);

    transactions.forEach(t => {
      if (t.date) {
        const monthStr = formatMonth(t.date);
        months.add(monthStr);
      }
      if (t.category) cats.add(t.category);
      if (t.bankName) banks.add(t.bankName);
      else banks.add('Cash');
    });

    return {
      uniqueMonths: Array.from(months),
      uniqueCategories: Array.from(cats),
      uniqueBanks: Array.from(banks),
    };
  }, [transactions]);

  // 4. Filtering Logic
  const filteredData = useMemo(() => {
    return transactions.filter((item) => {
      const itemMonth = formatMonth(item.date);
      if (selectedMonth !== 'All' && itemMonth !== selectedMonth) return false;
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      
      const itemBank = item.bankName || 'Cash';
      if (selectedBank !== 'All' && itemBank !== selectedBank) return false;

      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        (item.notes && item.notes.toLowerCase().includes(query)) ||
        item.category.toLowerCase().includes(query) ||
        item.amount.toString().includes(query);

      return matchesSearch;
    });
  }, [transactions, searchQuery, selectedMonth, selectedCategory, selectedBank]);
  
  const handleDelete = (id: string) => {
    Alert.alert("Delete", "Are you sure?", [
        { text: "Cancel" },
        { text: "Delete", style: 'destructive', onPress: () => dispatch(deleteTransaction(id)) }
    ]);
  };
  
  const handleEdit = (item: Transaction) => {
    // Navigate to AddExpense and pass the transaction object
    navigation.navigate('AddExpense', { transaction: item });
  };

  // Render Item
  const renderItem = ({ item }: { item: Transaction }) => (
    <Card style={styles.card} mode="elevated">
        <View style={styles.cardContent}>
            {/* Left Icon */}
            <View style={styles.leftSection}>
                <Avatar.Icon 
                    icon={item.type === 'CREDIT' ? 'bank-transfer-in' : 'receipt'} 
                    size={42} 
                    style={{ backgroundColor: item.type === 'CREDIT' ? '#E8F5E9' : '#FFEBEE' }} 
                    color={item.type === 'CREDIT' ? '#2E7D32' : '#C62828'}
                />
            </View>

            {/* Middle: Text Info */}
            <View style={styles.middleSection}>
                <Text variant="bodyLarge" style={{ fontWeight: 'bold' }} numberOfLines={1}>
                    {item.notes || item.category}
                </Text>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    {/* SOURCE BADGE */}
                    <View style={[
                        styles.sourceBadge, 
                        { backgroundColor: item.source === 'SMS' ? '#E3F2FD' : '#F5F5F5' }
                    ]}>
                        <Text style={{ 
                            fontSize: 10, 
                            fontWeight: 'bold', 
                            color: item.source === 'SMS' ? '#1976D2' : '#616161' 
                        }}>
                            {item.source === 'SMS' ? 'SMS' : 'MANUAL'}
                        </Text>
                    </View>

                    <Text variant="bodySmall" style={{ color: theme.colors.outline, marginLeft: 8 }}>
                        {item.date} • {item.bankName || 'Cash'}
                    </Text>
                </View>
            </View>

            {/* Right: Amount */}
            <View style={styles.rightSection}>
                <Text variant="labelLarge" style={{ 
                    color: item.type === 'DEBIT' ? theme.colors.error : theme.colors.primary,
                    fontWeight: 'bold'
                }}>
                    {item.type === 'DEBIT' ? '-' : '+'} ₹{item.amount}
                </Text>
                
                {/* Edit Button (Only show for Manual transactions if you want restrictive editing) */}
                <IconButton 
                    icon="pencil" 
                    size={18} 
                    iconColor={theme.colors.secondary}
                    onPress={() => handleEdit(item)}
                />
                 <IconButton 
                    icon="delete" 
                    size={18} 
                    iconColor={theme.colors.error}
                    onPress={() => handleDelete(item.id)}
                />
            </View>
        </View>
    </Card>
  );

  const renderFilterRow = (label: string, data: string[], selected: string, onSelect: (val: string) => void) => (
    <View style={styles.filterSection}>
        <Text variant="labelSmall" style={styles.filterLabel}>{label}</Text>
        <FlatList
            horizontal
            data={data}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
                <Chip 
                    selected={selected === item} 
                    onPress={() => onSelect(item)}
                    style={styles.chip}
                    textStyle={{ fontSize: 12 }}
                    showSelectedOverlay
                    compact
                >
                    {item}
                </Chip>
            )}
        />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.headerContainer}>
          <Searchbar
              placeholder="Search..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
              inputStyle={{ minHeight: 0 }}
          />
          {renderFilterRow('Month', uniqueMonths, selectedMonth, setSelectedMonth)}
          {renderFilterRow('Category', uniqueCategories, selectedCategory, setSelectedCategory)}
          {renderFilterRow('Bank', uniqueBanks, selectedBank, setSelectedBank)}
      </View>

      <Divider />

      <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          initialNumToRender={10}
          ListEmptyComponent={
              <View style={styles.emptyContainer}>
                  <Avatar.Icon icon="text-search" size={60} style={{ backgroundColor: '#eee', marginBottom: 10 }} color="#999"/>
                  <Text style={{ color: '#888' }}>No transactions found.</Text>
              </View>
          }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  searchBar: {
    backgroundColor: '#F5F5F5',
    elevation: 0,
    height: 40,
    borderRadius: 8,
    marginBottom: 10,
  },
  filterSection: { marginBottom: 8 },
  filterLabel: { color: '#888', marginBottom: 4, marginLeft: 2 },
  chip: { marginRight: 8, height: 32 },
  listContent: { padding: 16, paddingBottom: 40 },
  card: { marginBottom: 10, backgroundColor: '#fff', paddingVertical: 4 },
  cardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8
  },
  leftSection: { marginRight: 12 },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  sourceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    alignSelf: 'flex-start'
  },
  middleSection: { flex: 1, justifyContent: 'center', paddingRight: 8 },
  rightSection: { alignItems: 'flex-end' },
});

export default TransactionHistoryScreen;