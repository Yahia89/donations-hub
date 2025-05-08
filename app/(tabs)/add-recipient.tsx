import React, { useState, useCallback, useMemo } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { recipientService } from '../../services/recipientService';

interface FormData {
  name: string;
  date: string;
  address: string;
  phone_number: string;
  driver_license: string;
  marital_status: 'single' | 'married' | '';
  zakat_requests: string;
  notes: string;
  status: 'active' | 'inactive';
}

const AddRecipient: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    date: new Date().toISOString().split('T')[0],
    address: '',
    phone_number: '',
    driver_license: '',
    marital_status: '',
    zakat_requests: '1',
    notes: '',
    status: 'active',
  });

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      date: new Date().toISOString().split('T')[0],
      address: '',
      phone_number: '',
      driver_license: '',
      marital_status: '',
      zakat_requests: '1',
      notes: '',
      status: 'active',
    });
    setErrors({});
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.marital_status) newErrors.marital_status = 'Marital status is required';
    if (!formData.zakat_requests || parseInt(formData.zakat_requests) < 1) {
      newErrors.zakat_requests = 'Must be at least 1';
    }
    // Updated phone validation to match international format
    if (formData.phone_number && !/^\+?[1-9]\d{1,14}$/.test(formData.phone_number.replace(/[\s-]/g, ''))) {
      newErrors.phone_number = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const formatPhoneNumber = (text: string) => {
    // Remove all non-numeric characters except + at the start
    let cleaned = text.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) {
      // Keep the + and format the rest
      cleaned = '+' + cleaned.substring(1).replace(/\D/g, '');
    } else {
      cleaned = cleaned.replace(/\D/g, '');
    }
    
    // Format the number with spaces
    if (cleaned.startsWith('+')) {
      // International format
      if (cleaned.length > 3) {
        cleaned = cleaned.slice(0, 3) + ' ' + cleaned.slice(3);
      }
      if (cleaned.length > 7) {
        cleaned = cleaned.slice(0, 7) + ' ' + cleaned.slice(7);
      }
    } else {
      // Local format
      if (cleaned.length > 3) {
        cleaned = cleaned.slice(0, 3) + ' ' + cleaned.slice(3);
      }
      if (cleaned.length > 7) {
        cleaned = cleaned.slice(0, 7) + ' ' + cleaned.slice(7);
      }
    }
    
    return cleaned;
  };

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const newRecipient = {
        name: formData.name.trim(),
        date: formData.date,
        address: formData.address?.trim() || undefined,
        phone_number: formData.phone_number?.trim() || undefined,
        driver_license: formData.driver_license?.trim() || undefined,
        marital_status: formData.marital_status as 'single' | 'married',
        zakat_requests: parseInt(formData.zakat_requests, 10),
        notes: formData.notes?.trim() || undefined,
        status: formData.status,
      };

      await recipientService.addRecipient(newRecipient);
      setShowSuccess(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add recipient');
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm]);

  const handleDateChange = useCallback((event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData((prev) => ({
        ...prev,
        date: selectedDate.toISOString().split('T')[0],
      }));
      setErrors((prev) => ({ ...prev, date: undefined }));
    }
  }, []);

  const renderInput = useCallback(
    (
      field: keyof FormData,
      label: string,
      props: Partial<React.ComponentProps<typeof TextInput>> = {}
    ) => (
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          style={[
            styles.input,
            errors[field] && styles.inputError,
            field === 'notes' && styles.textArea,
          ]}
          value={formData[field]}
          onChangeText={(text) => {
            setFormData((prev) => ({ ...prev, [field]: text }));
            if (errors[field]) {
              setErrors((prev) => ({ ...prev, [field]: undefined }));
            }
          }}
          editable={!loading}
          selectTextOnFocus
          autoCorrect={false}
          {...props}
        />
        {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
      </View>
    ),
    [formData, errors, loading]
  );

  const SuccessModal = useMemo(
    () => (
      <Modal
        transparent
        visible={showSuccess}
        animationType="fade"
        onRequestClose={() => setShowSuccess(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
            <Text style={styles.successText}>Recipient Added Successfully!</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowSuccess(false);
                resetForm();
              }}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    ),
    [showSuccess, resetForm]
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <View style={styles.formContainer}>
            <Text style={styles.title}>Add New Recipient</Text>

            {renderInput('name', 'Name *', {
              placeholder: 'Enter recipient name',
              autoCapitalize: 'words',
            })}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date *</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={[styles.input, errors.date && styles.inputError]}
              >
                <Text style={styles.dateText}>{formData.date || 'Select date'}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={new Date(formData.date || new Date())}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={handleDateChange}
                  // Removed maximumDate to allow past dates
                />
              )}
              {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
            </View>

            {renderInput('address', 'Address', {
              placeholder: 'Enter address',
              multiline: true,
              numberOfLines: 2,
              autoCapitalize: 'sentences',
            })}
            {renderInput('phone_number', 'Phone Number', {
              placeholder: 'Enter phone number (e.g. +1 234 5678)',
              keyboardType: 'phone-pad',
              value: formData.phone_number,
              onChangeText: (text) => {
                const formatted = formatPhoneNumber(text);
                setFormData(prev => ({ ...prev, phone_number: formatted }));
                if (errors.phone_number) {
                  setErrors(prev => ({ ...prev, phone_number: undefined }));
                }
              }
            })}
            {renderInput('driver_license', 'Driver License Number', {
              placeholder: 'Enter driver license number',
              autoCapitalize: 'characters',
            })}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Marital Status *</Text>
              <View style={styles.radioGroup}>
                {['single', 'married'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.radioButton,
                      formData.marital_status === status && styles.radioButtonSelected,
                    ]}
                    onPress={() =>
                      setFormData((prev) => ({
                        ...prev,
                        marital_status: status as 'single' | 'married',
                      }))
                    }
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.radioText,
                        formData.marital_status === status && styles.radioTextSelected,
                      ]}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.marital_status && (
                <Text style={styles.errorText}>{errors.marital_status}</Text>
              )}
            </View>

            {renderInput('zakat_requests', 'Number of Zakat Requests *', {
              placeholder: 'Enter number of requests',
              keyboardType: 'number-pad',
            })}
            {renderInput('notes', 'Notes', {
              placeholder: 'Enter additional notes',
              multiline: true,
              numberOfLines: 4,
              textAlignVertical: 'top',
              autoCapitalize: 'sentences',
            })}

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.loadingText}>Adding...</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>Add Recipient</Text>
              )}
            </TouchableOpacity>
          </View>
          {SuccessModal}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  formContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
    minHeight: 50,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  inputError: {
    borderColor: '#ff4d4f',
  },
  errorText: {
    color: '#ff4d4f',
    fontSize: 14,
    marginTop: 6,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 50,
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  radioButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  radioButtonSelected: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  radioText: {
    fontSize: 16,
    color: '#666',
  },
  radioTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#999',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '85%',
    maxWidth: 400,
  },
  successText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginVertical: 20,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddRecipient;