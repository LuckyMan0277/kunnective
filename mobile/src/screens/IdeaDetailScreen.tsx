import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert, StyleSheet, TextInput, TouchableOpacity, Image } from 'react-native';
import { supabase } from '../lib/supabase';
import { Idea, IdeaComment } from '@kunnective/shared';

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

    const renderAvatar = (url?: string | null, name?: string) => {
        if (url) {
            return <Image source={{ uri: url }} style={styles.avatarImage} />;
        }
        return (
            <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>
                    {(name || '?').charAt(0).toUpperCase()}
                </Text>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    if (!idea) {
        return (
            <View style={styles.center}>
                <Text>아이디어를 찾을 수 없습니다.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.card}>
                    <View style={styles.headerRow}>
                        {renderAvatar(idea.author?.avatar_url, idea.author?.name)}
                        <View style={styles.headerText}>
                            <Text style={styles.authorName}>
                                {idea.author?.name}
                            </Text>
                            <Text style={styles.date}>
                                {new Date(idea.created_at).toLocaleDateString()}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.title}>{idea.title}</Text>
                    <View style={styles.tagRow}>
                        <View style={styles.tag}>
                            <Text style={styles.tagText}>
                                {idea.status}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.description}>
                        {idea.description}
                    </Text>

                    <View style={styles.statsRow}>
                        <Text style={styles.statsText}>
                            좋아요 {idea.likes_count}
                        </Text>
                        <Text style={styles.statsText}>
                            조회 {idea.view_count}
                        </Text>
                    </View>
                </View>

                <View>
                    <Text style={styles.sectionTitle}>
                        댓글 {comments.length}
                    </Text>

                    <View style={styles.commentList}>
                        {comments.map((comment) => (
                            <View key={comment.id} style={styles.commentCard}>
                                <View style={styles.commentHeader}>
                                    {renderAvatar(comment.author?.avatar_url, comment.author?.name)}
                                    <View style={styles.commentContent}>
                                        <View style={styles.commentMeta}>
                                            <Text style={styles.commentAuthor}>
                                                {comment.author?.name}
                                            </Text>
                                            <Text style={styles.commentDate}>
                                                {new Date(comment.created_at).toLocaleDateString()}
                                            </Text>
                                        </View>
                                        <Text style={styles.commentText}>
                                            {comment.content}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>

                    <View style={styles.inputCard}>
                        <TextInput
                            style={styles.input}
                            placeholder="댓글을 입력하세요..."
                            value={newComment}
                            onChangeText={setNewComment}
                            multiline
                        />
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleAddComment}
                            disabled={submitting}
                        >
                            <Text style={styles.submitButtonText}>
                                {submitting ? '작성 중...' : '댓글 작성'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 16,
        gap: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        marginBottom: 16,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerText: {
        marginLeft: 8,
    },
    authorName: {
        fontWeight: '600',
        color: '#111827',
    },
    date: {
        fontSize: 12,
        color: '#6b7280',
    },
    avatarImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e5e7eb',
    },
    avatarFallback: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarFallbackText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#111827',
    },
    tagRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    tag: {
        backgroundColor: '#dbeafe',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    tagText: {
        color: '#2563eb',
        fontSize: 12,
        fontWeight: '500',
    },
    description: {
        color: '#374151',
        lineHeight: 24,
        marginBottom: 24,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 16,
    },
    statsText: {
        color: '#6b7280',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    commentList: {
        gap: 12,
        marginBottom: 24,
    },
    commentCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    commentContent: {
        flex: 1,
        marginLeft: 8,
    },
    commentMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    commentAuthor: {
        fontWeight: '600',
        fontSize: 14,
        color: '#111827',
    },
    commentDate: {
        fontSize: 12,
        color: '#9ca3af',
    },
    commentText: {
        color: '#374151',
    },
    inputCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        gap: 8,
    },
    input: {
        minHeight: 80,
        textAlignVertical: 'top',
        padding: 0,
    },
    submitButton: {
        alignSelf: 'flex-end',
        backgroundColor: '#007AFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
});
