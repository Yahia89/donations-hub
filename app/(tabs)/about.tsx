import { Text, View, StyleSheet, Linking, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AboutScreen() {
  const handleContactPress = () => {
    Linking.openURL('mailto:info@techdevprime.com');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>About Donations Hub</Text>
      
      <View style={styles.content}>
        <Text style={styles.description}>
          Donations Hub is a comprehensive platform designed to streamline the management and distribution of donations to those in need. Our mission is to create transparency and efficiency in the donation process, ensuring that every contribution reaches its intended recipients.
        </Text>

        <Text style={styles.description}>
          Key Features:
          {"\n"}• Track donation distributions
          {"\n"}• Manage recipient information
          {"\n"}• Generate detailed reports
          {"\n"}• Ensure accountability and transparency
        </Text>

        <TouchableOpacity 
          style={styles.contactButton}
          onPress={handleContactPress}
          accessibilityLabel="Contact support"
        >
          <Ionicons name="mail" size={20} color="#fff" />
          <Text style={styles.contactText}>Contact Support</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#25292e',
    marginBottom: 20,
    textAlign: 'center',
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25292e',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  contactText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
