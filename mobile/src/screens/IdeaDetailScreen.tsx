import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { Idea, IdeaComment } from '@kunnective/shared';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { styled } from 'nativewind';

const StyledText = styled(Text);
const StyledView = styled(View);

export default function IdeaDetailScreen({ route }: any) {
    const { id } = route.params;
    const [idea, setIdea] = useState<Idea | null>(null);
    const [comments, setComments] = useState<IdeaComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadIdea();
        loadComments();
    }, [id]);

    const loadIdea = async () => {
        const { data, error } = await supabase
            .from('ideas')
            .select(`
        *,
        author:users!ideas_author_id_fkey(id, name, avatar_url)
      `)
            .eq('id', id)
            .single();

        if (data) setIdea(data);
        setLoading(false);
    };

    const loadComments = async () => {
        const { data } = await supabase
            .from('idea_comments')
            .select(`
        *,
        author:users!idea_comments_author_id_fkey(id, name, avatar_url)
      `)
            .eq('idea_id', id)
            .order('created_at', { ascending: true });

        if (data) setComments(data);
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        setSubmitting(true);
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            Alert.alert('오류', '로그인이 필요합니다');
            setSubmitting(false);
            return;
        }

        const { error } = await supabase.from('idea_comments').insert({
            idea_id: id,
            author_id: user.id,
            content: newComment,
        });

        if (error) {
            Alert.alert('오류', error.message);
        } else {
            setNewComment('');
            loadComments();
        }
        setSubmitting(false);
    };

    if (loading) {
        return (
            <StyledView className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#007AFF" />
            </StyledView>
        );
    }

    if (!idea) {
        return (
            <StyledView className="flex-1 items-center justify-center">
                <StyledText>아이디어를 찾을 수 없습니다.</StyledText>
            </StyledView>
        );
    }

    return (
        <ScrollView className="flex-1 bg-gray-50">
            <StyledView className="p-4 gap-4">
                <Card>
                    <StyledView className="flex-row items-center mb-4">
                        <Avatar
                            src={idea.author?.avatar_url}
                            fallback={idea.author?.name || '?'}
                            size="sm"
                            className="mr-2"
                        />
                        <StyledView>
                            <StyledText className="font-semibold text-gray-900">
                                {idea.author?.name}
                            </StyledText>
                            <StyledText className="text-xs text-gray-500">
                                {new Date(idea.created_at).toLocaleDateString()}
                            </StyledText>
                        </StyledView>
                    </StyledView>

                    <StyledText className="text-2xl font-bold mb-2">{idea.title}</StyledText>
                    <StyledView className="flex-row gap-2 mb-4">
                        <StyledView className="bg-blue-100 px-2 py-1 rounded">
                            <StyledText className="text-blue-600 text-xs font-medium">
                                {idea.status}
                            </StyledText>
                        </StyledView>
                    </StyledView>

                    <StyledText className="text-gray-700 leading-6 mb-6">
                        {idea.description}
                    </StyledText>

                    <StyledView className="flex-row justify-between border-t border-gray-100 pt-4">
                        <StyledText className="text-gray-500">
                            좋아요 {idea.likes_count}
                        </StyledText>
                        <StyledText className="text-gray-500">
                            조회 {idea.view_count}
                        </StyledText>
                    </StyledView>
                </Card>

                <StyledView>
                    <StyledText className="text-lg font-bold mb-4 px-1">
                        댓글 {comments.length}
                    </StyledText>

                    <StyledView className="gap-3 mb-6">
                        {comments.map((comment) => (
                            <Card key={comment.id} className="bg-white">
                                <StyledView className="flex-row items-start">
                                    <Avatar
                                        src={comment.author?.avatar_url}
                                        fallback={comment.author?.name || '?'}
                                        size="sm"
                                        className="mr-2 mt-1"
                                    />
                                    <StyledView className="flex-1">
                                        <StyledView className="flex-row justify-between items-center mb-1">
                                            <StyledText className="font-semibold text-sm">
                                                {comment.author?.name}
                                            </StyledText>
                                            <StyledText className="text-xs text-gray-400">
                                                {new Date(comment.created_at).toLocaleDateString()}
                                            </StyledText>
                                        </StyledView>
                                        <StyledText className="text-gray-700">
                                            {comment.content}
                                        </StyledText>
                                    </StyledView>
                                </StyledView>
                            </Card>
                        ))}
                    </StyledView>

                    <Card className="gap-2">
                        <Input
                            placeholder="댓글을 입력하세요..."
                            value={newComment}
                            onChangeText={setNewComment}
                            multiline
                        />
                        <Button
                            title="댓글 작성"
                            onPress={handleAddComment}
                            loading={submitting}
                            size="sm"
                            className="self-end"
                        />
                    </Card>
                </StyledView>
            </StyledView>
        </ScrollView>
    );
}
