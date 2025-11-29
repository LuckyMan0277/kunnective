import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { UserProfile } from '@kunnective/shared';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data);
      }
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.name?.[0]?.toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.name}>{profile?.name || '이름 없음'}</Text>
        <Text style={styles.email}>{profile?.email}</Text>
        {profile?.is_seeking_team && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>🔥 팀 구하는 중</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('ProfileEdit' as any)}
        >
          <Text style={styles.editButtonText}>프로필 수정</Text>
        </TouchableOpacity>
      </View>

      {profile && (
        <View style={styles.section}>
          <InfoRow label="전공" value={profile.major || '미설정'} />
          <InfoRow
            label="학년"
            value={profile.year ? `${profile.year}학년` : '미설정'}
          />
          <InfoRow label="자기소개" value={profile.bio || '미설정'} />

          {profile.values && profile.values.length > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>가치관</Text>
              <View style={styles.tags}>
                {profile.values.map((value, idx) => (
                  <View key={idx} style={[styles.tag, { backgroundColor: '#e3f2fd' }]}>
                    <Text style={[styles.tagText, { color: '#1976d2' }]}>{value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {profile.personality && profile.personality.length > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>성격</Text>
              <View style={styles.tags}>
                {profile.personality.map((item, idx) => (
                  <View key={idx} style={[styles.tag, { backgroundColor: '#f3e5f5' }]}>
                    <Text style={[styles.tagText, { color: '#7b1fa2' }]}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {profile.skills && profile.skills.length > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>관심 분야 / 스킬</Text>
              <View style={styles.tags}>
                {profile.skills.map((skill, idx) => (
                  <View key={idx} style={styles.tag}>
                    <Text style={styles.tagText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 16,
  },
  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    marginTop: 8,
    backgroundColor: '#fff3e0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#e65100',
    fontSize: 12,
    fontWeight: 'bold',
  },
  editButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
