import { useState } from 'react';
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
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { recipientService } from '../../services/recipientService';
import { Ionicons } from '@expo/vector-icons';

export default function AddRecipient() {
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const defaultFormData = {
    name: '',
    date: new Date().toISOString().split('T')[0],
    address: '',
    phone_number: '',
    driver_license: '',
    marital_status: '',
    zakat_requests: '1',
    notes: '',
    status: 'active',
  };
  const [formData, setFormData] = useState(defaultFormData);

  const resetForm = () => {
    setFormData(defaultFormData);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.date.trim()) {
      newErrors.date = 'Date is required';
    }
    if (formData.zakat_requests && parseInt(formData.zakat_requests) < 1) {
      newErrors.zakat_requests = 'Must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const newRecipient = {
        ...formData,
        zakat_requests: parseInt(formData.zakat_requests, 10),
      };

      await recipientService.addRecipient({
        ...newRecipient,
        marital_status: newRecipient.marital_status as "single" | "married",
      });
      setShowSuccess(true);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const SuccessModal = () => (
    <Modal
      transparent
      visible={showSuccess}
      animationType="fade"
      onRequestClose={() => setShowSuccess(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
          </View>
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
  );

  const renderInput = (field: string, label: string, props = {}) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          errors[field] && styles.inputError,
          field === 'notes' && styles.textArea,
        ]}
        value={formData[field as keyof typeof formData]}
        onChangeText={(text) => {
          setFormData({ ...formData, [field]: text });
          if (errors[field]) {
            setErrors({ ...errors, [field]: '' });
          }
        }}
        {...props}
      />
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAwareScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            <Text style={styles.title}>Add New Recipient</Text>

            {renderInput('date', 'Date', { placeholder: 'YYYY-MM-DD' })}
            {renderInput('name', 'Name *', { placeholder: 'Enter recipient name' })}
            {renderInput('address', 'Address', {
              placeholder: 'Enter address',
              multiline: true,
            })}
            {renderInput('phone_number', 'Phone Number', {
              placeholder: 'Enter phone number',
              keyboardType: 'phone-pad',
            })}
            {renderInput('driver_license', 'Driver License Number', {
              placeholder: 'Enter driver license number',
            })}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Marital Status</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={[
                    styles.radioButton,
                    formData.marital_status === 'single' && styles.radioButtonSelected,
                  ]}
                  onPress={() =>
                    setFormData({ ...formData, marital_status: 'single' })
                  }
                >
                  <Text
                    style={[
                      styles.radioText,
                      formData.marital_status === 'single' && { color: '#fff' },
                    ]}
                  >
                    Single
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.radioButton,
                    formData.marital_status === 'married' && styles.radioButtonSelected,
                  ]}
                  onPress={() =>
                    setFormData({ ...formData, marital_status: 'married' })
                  }
                >
                  <Text
                    style={[
                      styles.radioText,
                      formData.marital_status === 'married' && { color: '#fff' },
                    ]}
                  >
                    Married
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {renderInput('zakat_requests', 'Number of Zakat Requests', {
              placeholder: 'Enter number of requests',
              keyboardType: 'numeric',
            })}
            {renderInput('notes', 'Notes', {
              placeholder: 'Enter additional notes',
              multiline: true,
              numberOfLines: 4,
              textAlignVertical: 'top',
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
          <SuccessModal />
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flexGrow: 1,
  },
  formContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#25292e',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ff4444',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#25292e',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  radioButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    width: '45%',
    alignItems: 'center',
  },
  radioButtonSelected: {
    backgroundColor: '#25292e',
    borderColor: '#25292e',
  },
  radioText: {
    fontSize: 16,
    color: '#666',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '80%',
  },
  successIcon: {
    marginBottom: 16,
  },
  successText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#25292e',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
