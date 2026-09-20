// src/screens/HelpCenterScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { supportAPI } from '../lib/api';

const FAQS = [
  {
    question: 'How do I sell an item on Campus Marketplace?',
    answer:
      'Go to the Sell tab, add photos, a title, description, price and category, then tap Post. Your listing goes live immediately for other students to browse.',
  },
  {
    question: 'How does payment and checkout work?',
    answer:
      'Payments are processed securely through PayFast at checkout. You can save your address and card details in your Profile for faster checkout next time.',
  },
  {
    question: 'How do I message a seller or buyer?',
    answer:
      'Tap a product to open its details, then tap Message Seller. All your conversations are also available under Profile → Messages.',
  },
  {
    question: 'How do I verify my student account?',
    answer:
      'Verification happens automatically when you sign up with your CPUT student email. If your account shows as unverified, check Account Information in your Profile.',
  },
  {
    question: 'What do I do if an item wasn\u2019t as described?',
    answer:
      'Message the seller first to resolve it directly. If that doesn\u2019t work, submit a support request below and our team will step in.',
  },
  {
    question: 'How do I change my password?',
    answer: 'Go to Profile → Security → Change Password and follow the prompts.',
  },
];

export default function HelpCenterScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleFaq = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in both a subject and message');
      return;
    }

    setIsSubmitting(true);
    try {
      await supportAPI.submitRequest(user!.id, subject.trim(), message.trim());
      Alert.alert('Request Sent', 'Our support team will get back to you soon.');
      setSubject('');
      setMessage('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Help Center</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={[styles.sectionHeading, { color: colors.text }]}>Frequently Asked Questions</Text>

        {FAQS.map((faq, index) => {
          const isOpen = expandedIndex === index;
          return (
            <TouchableOpacity
              key={index}
              style={[styles.faqCard, { backgroundColor: colors.card }]}
              onPress={() => toggleFaq(index)}
              activeOpacity={0.8}
            >
              <View style={styles.faqQuestionRow}>
                <Text style={[styles.faqQuestion, { color: colors.text }]}>{faq.question}</Text>
                <Ionicons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textLight}
                />
              </View>
              {isOpen && (
                <Text style={[styles.faqAnswer, { color: colors.textLight }]}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          );
        })}

        <Text style={[styles.sectionHeading, { color: colors.text, marginTop: 28 }]}>
          Still need help?
        </Text>

        <TouchableOpacity
          style={[styles.emailRow, { backgroundColor: colors.card }]}
          onPress={() => Linking.openURL('mailto:support@campusmarketplace.tech')}
        >
          <Ionicons name="mail-outline" size={20} color={colors.primary} />
          <Text style={[styles.emailText, { color: colors.text }]}>support@campusmarketplace.tech</Text>
        </TouchableOpacity>

        <View style={[styles.formCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.formLabel, { color: colors.text }]}>Send us a message</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            placeholder="Subject"
            placeholderTextColor={colors.textLight}
            value={subject}
            onChangeText={setSubject}
          />
          <TextInput
            style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border }]}
            placeholder="Describe your issue..."
            placeholderTextColor={colors.textLight}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Request</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  backButton: { padding: 4 },
  title: { fontSize: 20, fontWeight: '700', marginLeft: 16 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionHeading: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  faqCard: { borderRadius: 12, padding: 16, marginBottom: 10 },
  faqQuestionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { fontSize: 14, fontWeight: '600', flex: 1, marginRight: 10 },
  faqAnswer: { fontSize: 13, lineHeight: 19, marginTop: 10 },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  emailText: { fontSize: 14, fontWeight: '600', marginLeft: 10 },
  formCard: { borderRadius: 12, padding: 16 },
  formLabel: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  textArea: { height: 110, paddingTop: 12 },
  submitButton: { paddingVertical: 14, borderRadius: 25, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
