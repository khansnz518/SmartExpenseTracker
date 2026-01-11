import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, HelperText, Text, useTheme, Menu, TouchableRipple } from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useDispatch } from 'react-redux';
import { addTransaction, editTransaction } from '../../store/expenseSlice'; // Import editTransaction
import { AppDispatch } from '../../store/store'; // Import AppDispatch

type Props = NativeStackScreenProps<RootStackParamList, 'AddExpense'>;

const ExpenseSchema = Yup.object().shape({
  amount: Yup.number().required('Amount is required').positive(),
  category: Yup.string().required('Category is required'),
  notes: Yup.string(),
});

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Salary', 'Investment'];

const AddExpenseScreen: React.FC<Props> = ({ navigation, route }) => {
  const theme = useTheme();
  // const dispatch = useDispatch();
  const dispatch = useDispatch<AppDispatch>();

  // Check if we are editing (transaction passed via params)
  const transactionToEdit = route.params?.transaction;
  const isEditMode = !!transactionToEdit;
  
  const [menuVisible, setMenuVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Initialize Date: If editing, use existing date, else today
  const [selectedDate, setSelectedDate] = useState(
    isEditMode && transactionToEdit ? new Date(transactionToEdit.date) : new Date()
  );

  const handleSubmitExpense = (values: any) => {
    const formattedDate = selectedDate.toISOString().split('T')[0];

    if (isEditMode && transactionToEdit) {
      // EDIT
      dispatch(editTransaction({
        id: transactionToEdit.id,
        type: transactionToEdit.type,
        bankName: transactionToEdit.bankName,
        amount: Number(values.amount),
        category: values.category,
        date: formattedDate,
        notes: values.notes || '',
        source: 'MANUAL',
      }));
    } else {
      // ADD
      dispatch(addTransaction({
        amount: Number(values.amount),
        category: values.category,
        date: formattedDate,
        notes: values.notes || '',
        bankName: 'Cash',
        type: 'DEBIT',
        source: 'MANUAL',
      }));
    }
    
    navigation.goBack();
  };
  // const handleSubmitExpense = (values: any) => {
  //   const formattedDate = selectedDate.toISOString().split('T')[0];

  //   if (isEditMode && transactionToEdit) {
  //     // EDIT MODE: Dispatch Edit Action
  //     dispatch(editTransaction({
  //       id: transactionToEdit.id,
  //       type: transactionToEdit.type, // Keep original type
  //       bankName: transactionToEdit.bankName, // Keep original bank
  //       amount: Number(values.amount),
  //       category: values.category,
  //       date: formattedDate,
  //       notes: values.notes || '',
  //     }));
  //   } else {
  //     // ADD MODE: Dispatch Add Action
  //     dispatch(addTransaction({
  //       amount: Number(values.amount),
  //       category: values.category,
  //       date: formattedDate,
  //       notes: values.notes || '',
  //     }));
  //   }
    
  //   navigation.goBack();
  // };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Formik
        initialValues={{ 
            amount: isEditMode ? transactionToEdit?.amount.toString() : '', 
            category: isEditMode ? transactionToEdit?.category : '', 
            notes: isEditMode ? transactionToEdit?.notes : '' 
        }}
        validationSchema={ExpenseSchema}
        onSubmit={handleSubmitExpense}
      >
        {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched }) => (
          <ScrollView contentContainerStyle={styles.formContent}>
            
            <Text variant="titleLarge" style={styles.header}>
                {isEditMode ? 'Edit Transaction' : 'New Expense'}
            </Text>

            {/* Amount */}
            <TextInput
              label="Amount (₹)"
              mode="outlined"
              keyboardType="numeric"
              value={values.amount}
              onChangeText={handleChange('amount')}
              onBlur={handleBlur('amount')}
              error={touched.amount && !!errors.amount}
              style={styles.input}
            />
            <HelperText type="error" visible={touched.amount && !!errors.amount}>{errors.amount}</HelperText>

            {/* Category Dropdown */}
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <TouchableRipple onPress={() => setMenuVisible(true)}>
                  <View pointerEvents="none">
                    <TextInput
                      label="Category"
                      mode="outlined"
                      value={values.category}
                      style={styles.input}
                      right={<TextInput.Icon icon="chevron-down" />}
                    />
                  </View>
                </TouchableRipple>
              }
            >
              {CATEGORIES.map((cat) => (
                <Menu.Item key={cat} onPress={() => { setFieldValue('category', cat); setMenuVisible(false); }} title={cat} />
              ))}
            </Menu>

            {/* Date Picker Trigger */}
            <TouchableRipple onPress={() => setShowDatePicker(true)}>
                <View pointerEvents="none">
                    <TextInput
                        label="Date"
                        mode="outlined"
                        value={selectedDate.toDateString()}
                        style={[styles.input, { marginTop: 20 }]}
                        right={<TextInput.Icon icon="calendar" />}
                    />
                </View>
            </TouchableRipple>

            {/* Mock Date Picker Logic */}
            {showDatePicker && (
               <View style={{ marginVertical: 10, padding: 10, backgroundColor: '#eee', borderRadius: 8 }}>
                  <Text style={{ marginBottom: 5 }}>Select Date:</Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                      <Button mode="contained-tonal" compact onPress={() => { setSelectedDate(new Date()); setShowDatePicker(false); }}>Today</Button>
                      <Button mode="contained-tonal" compact onPress={() => { const d = new Date(); d.setDate(d.getDate()-1); setSelectedDate(d); setShowDatePicker(false); }}>Yesterday</Button>
                  </View>
               </View>
            )}

            {/* Notes */}
            <TextInput
              label="Notes"
              mode="outlined"
              multiline
              numberOfLines={3}
              value={values.notes}
              onChangeText={handleChange('notes')}
              style={[styles.input, { marginTop: 20 }]}
            />

            <Button 
                mode="contained" 
                onPress={() => handleSubmit()} 
                style={styles.submitButton}
            >
              {isEditMode ? 'Update Transaction' : 'Save Expense'}
            </Button>
          </ScrollView>
        )}
      </Formik>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  formContent: { padding: 24 },
  header: { marginBottom: 24, fontWeight: 'bold' ,marginTop:24},
  input: { backgroundColor: '#fff', marginBottom: 5 ,},
  submitButton: { marginTop: 24, borderRadius: 8 },
});

export default AddExpenseScreen;