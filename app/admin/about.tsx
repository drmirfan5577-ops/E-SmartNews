
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '@/hooks/useApp';
import { LAUNCHERS } from '@/constants/launchers';
import { CHANNEL } from '@/constants/theme';

const Section = ({ title, children, theme }: any) => (
  <View style={[aStyles.section, { backgroundColor: theme.surface, borderColor: theme.primary + '33' }]}>
    <View style={[aStyles.sectionHeader, { backgroundColor: theme.primary + '22', borderBottomColor: theme.primary + '33' }]}>
      <Text style={[aStyles.sectionTitle, { color: theme.gold }]}>{title}</Text>
    </View>
    <View style={aStyles.sectionBody}>{children}</View>
  </View>
);

export default function About() {
  const { activeLauncher, language } = useApp();
  const theme = LAUNCHERS[activeLauncher] ?? LAUNCHERS[0];
  const router = useRouter();

  const bodyText = [aStyles.bodyText, { color: theme.textMuted }];
  const headText = [aStyles.headText, { color: theme.text }];

  return (
    <View style={[aStyles.root, { backgroundColor: theme.background }]}>
      <LinearGradient colors={[theme.glow, 'transparent']} style={StyleSheet.absoluteFillObject} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[aStyles.header, { backgroundColor: theme.surface, borderBottomColor: theme.primary + '44' }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={20} color={theme.textMuted} />
          </TouchableOpacity>
          <Text style={[aStyles.title, { color: theme.text }]}>ABOUT & LEGAL</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={aStyles.scroll} showsVerticalScrollIndicator={false}>

          {/* Channel Identity */}
          <View style={[aStyles.logoCard, { backgroundColor: theme.primary + '18', borderColor: theme.primary + '44' }]}>
            <LinearGradient colors={[theme.primary + '28', 'transparent']} style={StyleSheet.absoluteFillObject} />
            <View style={[aStyles.logoBall, { backgroundColor: theme.primary }]}>
              <Text style={aStyles.logoSW}>SW</Text>
            </View>
            <Text style={[aStyles.channelName, { color: theme.text }]}>SMART WORLD NEWS</Text>
            <Text style={[aStyles.channelUr, { color: theme.textMuted }]}>سمارٹ ورلڈ نیوز</Text>
            <Text style={[aStyles.tagline, { color: theme.gold }]}>"Truth through the Lens"</Text>
            <View style={[aStyles.divLine, { backgroundColor: theme.primary + '55' }]} />
            <Text style={[aStyles.motto, { color: theme.textMuted }]}>
              We bring what they hide · Both eyes on what's really going on{'\n'}
              Dark Realities · Hidden Facts · Deeper Insights
            </Text>
          </View>

          {/* About Us */}
          <Section title="ABOUT US — ہمارے بارے میں" theme={theme}>
            <Text style={headText}>EvEr SmArT-DiGiTaL-wOrLd</Text>
            <Text style={bodyText}>Dr M Irfan Qadir Thaheem</Text>
            <Text style={[bodyText, { color: theme.gold }]}>The One Man Army</Text>
            <Text style={bodyText}>{'\n'}A project of: SMART WORLD ORDER{'\n'}A Global Family Platform Vision{'\n'}</Text>
            <Text style={bodyText}>
              In an era dominated by sensationalism, fear-mongering, and misinformation, this channel stands in contrast. Our purpose is not merely to make a global village, but to elevate humanity to a Global Family Platform.
            </Text>
            <Text style={[bodyText, { marginTop: 10 }]}>
              اس چینل کا مقصد دنیا کو صرف ایک گلوبل ولیج نہیں بلکہ ایک عالمی فیملی پلیٹ فارم بنانا ہے۔
            </Text>
            <TouchableOpacity
              style={[aStyles.emailBtn, { backgroundColor: theme.primary + '22', borderColor: theme.primary + '55' }]}
              onPress={() => Linking.openURL(`mailto:${CHANNEL.email}`)}
            >
              <MaterialIcons name="email" size={14} color={theme.primary} />
              <Text style={[aStyles.emailText, { color: theme.primary }]}>{CHANNEL.email}</Text>
            </TouchableOpacity>
          </Section>

          {/* Disclaimer */}
          <Section title="⚠️ DISCLAIMER — دستبرداری" theme={theme}>
            <Text style={bodyText}>
              The news broadcast herein is derived from publicly available information. While this organization endeavors to verify every news item and ascertain solid evidence through all its resources, the organization shall not be held responsible for any inaccuracies or omissions in any news.
            </Text>
            <Text style={[bodyText, { marginTop: 8 }]}>
              It is your responsibility to confirm the information.
            </Text>
            <Text style={[bodyText, { color: theme.gold, marginTop: 8 }]}>JazakAllah and Thank you.</Text>
            <Text style={[bodyText, { marginTop: 8 }]}>
              All copyrights reserved to: SMART WORLD ORDER · One Man Army · Dr M Irfan Qadir Thaheem.
            </Text>
            <Text style={[bodyText, { marginTop: 8, fontStyle: 'italic' }]}>
              Backend, Research and Analytics on DARK realities, HIDDEN facts, DEEPER insights & Reality finding about Conspiracy theories running in the background only.
            </Text>
            <Text style={[bodyText, { color: theme.primary, marginTop: 8 }]}>
              {">>>"}Stay connected, and keep on watching. SmartWorldOrder, One Man Army.
            </Text>
          </Section>

          {/* Privacy Policy */}
          <Section title="🔒 PRIVACY POLICY — رازداری" theme={theme}>
            <Text style={bodyText}>
              • This application stores all data locally on your device only.{'\n'}
              • No personal data is collected or transmitted to external servers.{'\n'}
              • News content, links, and media are managed by the admin and stored locally.{'\n'}
              • Background music tracks are processed locally and never shared.{'\n'}
              • Sub-admin credentials are stored encrypted on the device only.{'\n'}
              • The channel does not track viewers or collect analytics without consent.{'\n'}
              • Social media links are user-configured and open externally in the device browser.
            </Text>
          </Section>

          {/* Broadcasting Standards */}
          <Section title="📡 BROADCASTING STANDARDS" theme={theme}>
            <Text style={bodyText}>
              Smart World News adheres to internationally recognized broadcasting standards:{'\n\n'}
              • Content is verified before broadcast to the best of our ability.{'\n'}
              • Sensitive content carries appropriate warnings.{'\n'}
              • Breaking news is labeled as unverified until confirmed.{'\n'}
              • Equal representation and balanced reporting is our commitment.{'\n'}
              • Privacy of individuals is respected in all broadcasts.{'\n'}
              • International broadcasting treaties and copyright laws are observed.{'\n'}
              • Content does not promote violence, discrimination, or illegal activities.
            </Text>
          </Section>

          {/* Social Media Notice */}
          <Section title="📱 SOCIAL MEDIA NOTICE" theme={theme}>
            <Text style={bodyText}>
              Content shared via this channel is intended for informational purposes only. When sharing on social media platforms:{'\n\n'}
              • Credit Smart World News and Dr M Irfan Qadir Thaheem.{'\n'}
              • Do not alter or misrepresent the original content.{'\n'}
              • Each platform has its own terms of service — comply accordingly.{'\n'}
              • Automated broadcasting to linked accounts is a technical integration and subject to each platform's API policies.{'\n'}
              • We are not responsible for third-party platform policies or restrictions.
            </Text>
          </Section>

          {/* Global Vision */}
          <Section title="🌍 THE GLOBAL FAMILY PLATFORM VISION" theme={theme}>
            <Text style={bodyText}>
              Through multi-language subtitles in 10+ languages, our aim is to provide comprehensive public information, keep audiences informed of constantly evolving situations and events, and offer genuine insight into the underlying realities often inaccessible to the general public.
            </Text>
            <Text style={[bodyText, { color: theme.gold, marginTop: 10, fontWeight: '600' }]}>
              Comprehensive solutions · Concise news · Authentic and impactful.
            </Text>
            <Text style={[bodyText, { marginTop: 8 }]}>
              مکمل حل · مختصر خبریں · مستند اور پراثر
            </Text>
          </Section>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const aStyles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
  title: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  scroll: { padding: 14, gap: 12 },
  logoCard: { borderRadius: 10, borderWidth: 1, padding: 20, alignItems: 'center', gap: 8, overflow: 'hidden', position: 'relative' },
  logoBall: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  logoSW: { color: '#fff', fontWeight: '900', fontSize: 18, letterSpacing: 2 },
  channelName: { fontSize: 18, fontWeight: '800', letterSpacing: 3 },
  channelUr: { fontSize: 14 },
  tagline: { fontSize: 13, fontStyle: 'italic', fontWeight: '600' },
  divLine: { height: 1, width: '80%', marginVertical: 6 },
  motto: { fontSize: 11, textAlign: 'center', lineHeight: 18, letterSpacing: 0.5 },
  section: { borderRadius: 8, borderWidth: 1, overflow: 'hidden' },
  sectionHeader: { padding: 12, borderBottomWidth: 1 },
  sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  sectionBody: { padding: 14 },
  headText: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  bodyText: { fontSize: 12, lineHeight: 20, letterSpacing: 0.3 },
  emailBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, marginTop: 12, alignSelf: 'flex-start' },
  emailText: { fontSize: 13, fontWeight: '600' },
});
