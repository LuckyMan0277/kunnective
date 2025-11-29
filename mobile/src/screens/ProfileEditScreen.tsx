import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ScrollView,
    TouchableOpacity,
    Alert,
    Switch,
    ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { UserProfile } from '@kunnective/shared';

export default function ProfileEditScreen() {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [major, setMajor] = useState('');
    const [year, setYear] = useState('');
    const [skills, setSkills] = useState<string[]>([]);
    const [skillInput, setSkillInput] = useState('');
    const [values, setValues] = useState<string[]>([]);
    const [personality, setPersonality] = useState<string[]>([]);
    const [isSeekingTeam, setIsSeekingTeam] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (data) {
                setName(data.name || '');
                setBio(data.bio || '');
                setMajor(data.major || '');
                setYear(data.year || '');
                setSkills(data.skills || []);
                setValues(data.values || []);
                setPersonality(data.personality || []);
                setIsSeekingTeam(data.is_seeking_team || false);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('users')
                .update({
                    name,
                    bio,
                    major,
                    year,
                    skills,
                    values,
                    personality,
                    is_seeking_team: isSeekingTeam,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (error) throw error;

            Alert.alert('성공', '프로필이 저장되었습니다');
            navigation.goBack();
        } catch (error) {
            console.error('Error saving profile:', error);
            Alert.alert('오류', '프로필 저장에 실패했습니다');
        } finally {
            setSaving(false);
        }
    };

    const toggleSelection = (
        list: string[],
        setList: (l: string[]) => void,
        item: string,
        max: number = 3
    ) => {
        if (list.includes(item)) {
            setList(list.filter((i) => i !== item));
        } else {
            if (list.length >= max) {
                Alert.alert('알림', `최대 ${max}개까지 선택 가능합니다`);
                return;
            }
            setList([...list, item]);
        }
    };

    const addSkill = () => {
        const trimmed = skillInput.trim();
        if (trimmed && !skills.includes(trimmed)) {
            setSkills([...skills, trimmed]);
            setSkillInput('');
        }
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
            <View style={styles.section}>
                <Text style={styles.label}>이름</Text>
                <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="이름 입력"
                />

                <Text style={styles.label}>전공</Text>
                <TextInput
                    style={styles.input}
                    value={major}
                    onChangeText={setMajor}
                    placeholder="전공 입력"
                />

                <Text style={styles.label}>학년</Text>
                <TextInput
                    style={styles.input}
                    value={year}
                    onChangeText={setYear}
                    placeholder="학년 입력"
                    keyboardType="numeric"
                />

                <Text style={styles.label}>자기소개</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={bio}
                    onChangeText={setBio}
                    placeholder="자기소개 입력"
                    multiline
                    numberOfLines={4}
                />
            </View>

            <View style={styles.section}>
                <View style={styles.rowBetween}>
                    <Text style={styles.label}>팀 구하는 중 🔥</Text>
                    <Switch
                        value={isSeekingTeam}
                        onValueChange={setIsSeekingTeam}
                        trackColor={{ false: '#767577', true: '#007AFF' }}
                        thumbColor={isSeekingTeam ? '#fff' : '#f4f3f4'}
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>가치관 (최대 3개)</Text>
                <View style={styles.chipContainer}>
                    {['성장', '재미', '돈', '인정', '안정', '효율', '소통', '도전'].map((item) => (
                        <TouchableOpacity
                            key={item}
                            style={[
                                styles.chip,
                                values.includes(item) && styles.chipSelected,
                            ]}
                            onPress={() => toggleSelection(values, setValues, item)}
                        >
                            <Text
                                style={[
                                    styles.chipText,
                                    values.includes(item) && styles.chipTextSelected,
                                ]}
                            >
                                {item}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>성격 (최대 3개)</Text>
                <View style={styles.chipContainer}>
                    {['리더형', '팔로워형', '계획적', '즉흥적', '소통왕', '조용함', '열정적', '분석적'].map((item) => (
                        <TouchableOpacity
                            key={item}
                            style={[
                                styles.chip,
                                personality.includes(item) && styles.chipSelected,
                            ]}
                            onPress={() => toggleSelection(personality, setPersonality, item)}
                        >
                            <Text
                                style={[
                                    styles.chipText,
                                    personality.includes(item) && styles.chipTextSelected,
                                ]}
                            >
                                {item}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>스킬 / 관심사</Text>
                <View style={styles.inputRow}>
                    <TextInput
                        style={[styles.input, { flex: 1, marginBottom: 0 }]}
                        value={skillInput}
                        onChangeText={setSkillInput}
                        placeholder="스킬 입력 (예: React)"
                        onSubmitEditing={addSkill}
                    />
                    <TouchableOpacity style={styles.addButton} onPress={addSkill}>
                        <Text style={styles.addButtonText}>추가</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.chipContainer}>
                    {skills.map((skill) => (
                        <TouchableOpacity
                            key={skill}
                            style={styles.skillChip}
                            onPress={() => setSkills(skills.filter((s) => s !== skill))}
                        >
                            <Text style={styles.skillChipText}>{skill} ✕</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.saveButton, saving && styles.disabledButton]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    <Text style={styles.saveButtonText}>
                        {saving ? '저장 중...' : '저장하기'}
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
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
    section: {
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 12,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    chipSelected: {
        backgroundColor: '#e3f2fd',
        borderColor: '#2196f3',
    },
    chipText: {
        fontSize: 14,
        color: '#666',
    },
    chipTextSelected: {
        color: '#2196f3',
        fontWeight: '600',
    },
    inputRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    addButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 16,
        justifyContent: 'center',
        borderRadius: 8,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    skillChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#eee',
        flexDirection: 'row',
        alignItems: 'center',
    },
    skillChipText: {
        fontSize: 14,
        color: '#333',
    },
    footer: {
        padding: 16,
        paddingBottom: 32,
    },
    saveButton: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.5,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
