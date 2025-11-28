import React, { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export default function CreateIdeaScreen({ navigation }: any) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!title || !description || !category) {
            Alert.alert('오류', '모든 필드를 입력해주세요');
            return;
        }

        setLoading(true);
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            Alert.alert('오류', '로그인이 필요합니다');
            setLoading(false);
            return;
        }

        const { error } = await supabase.from('ideas').insert({
            title,
            description,
            category,
            author_id: user.id,
        });

        setLoading(false);

        if (error) {
            Alert.alert('오류', error.message);
        } else {
            Alert.alert('성공', '아이디어가 등록되었습니다', [
                { text: '확인', onPress: () => navigation.goBack() },
            ]);
        }
    };

    return (
        <ScrollView className="flex-1 bg-gray-50 p-4">
            <Card className="gap-4">
                <Input
                    label="제목"
                    placeholder="아이디어 제목을 입력하세요"
                    value={title}
                    onChangeText={setTitle}
                />
                <Input
                    label="카테고리"
                    placeholder="예: IT, 디자인, 마케팅"
                    value={category}
                    onChangeText={setCategory}
                />
                <Input
                    label="설명"
                    placeholder="아이디어에 대해 자세히 설명해주세요"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={6}
                    className="h-32"
                    textAlignVertical="top"
                />
                <Button
                    title="등록하기"
                    onPress={handleSubmit}
                    loading={loading}
                    className="mt-4"
                />
            </Card>
        </ScrollView>
    );
}
