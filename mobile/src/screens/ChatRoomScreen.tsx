import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase';
import { ChatMessage, UserProfile } from '@kunnective/shared';
import { Avatar } from '../components/ui/Avatar';
import { Ionicons } from '@expo/vector-icons';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity);

export default function ChatRoomScreen({ route, navigation }: any) {
    const { roomId, otherUser } = route.params;
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        loadCurrentUser();
        loadMessages();
        subscribeToMessages();
    }, [roomId]);

    const loadCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
            setCurrentUser(data);
        }
    };

    const loadMessages = async () => {
        const { data } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('room_id', roomId)
            .order('created_at', { ascending: true });

        if (data) setMessages(data);
    };

    const subscribeToMessages = () => {
        const subscription = supabase
            .channel(`room:${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `room_id=eq.${roomId}`,
                },
                (payload) => {
                    setMessages((prev) => [...prev, payload.new as ChatMessage]);
                    flatListRef.current?.scrollToEnd({ animated: true });
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    };

    const handleSend = async () => {
        if (!newMessage.trim() || !currentUser) return;

        const { error } = await supabase.from('chat_messages').insert({
            room_id: roomId,
            sender_id: currentUser.id,
            content: newMessage.trim(),
        });

        if (error) {
            console.error(error);
        } else {
            setNewMessage('');
        }
    };

    const renderItem = ({ item }: { item: ChatMessage }) => {
        const isMe = item.sender_id === currentUser?.id;

        return (
            <StyledView className={`flex-row mb-4 ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && (
                    <Avatar
                        src={otherUser?.avatar_url}
                        fallback={otherUser?.name || '?'}
                        size="sm"
                        className="mr-2 self-end"
                    />
                )}
                <StyledView
                    className={`px-4 py-2 rounded-2xl max-w-[70%] ${isMe ? 'bg-blue-500 rounded-br-none' : 'bg-gray-200 rounded-bl-none'
                        }`}
                >
                    <StyledText className={isMe ? 'text-white' : 'text-gray-800'}>
                        {item.content}
                    </StyledText>
                </StyledView>
            </StyledView>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1 bg-white"
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16 }}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            />
            <StyledView className="p-4 border-t border-gray-100 flex-row items-center gap-2">
                <StyledTextInput
                    className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-base"
                    placeholder="메시지를 입력하세요..."
                    value={newMessage}
                    onChangeText={setNewMessage}
                    multiline
                />
                <StyledTouchableOpacity
                    onPress={handleSend}
                    disabled={!newMessage.trim()}
                    className={`w-10 h-10 rounded-full items-center justify-center ${newMessage.trim() ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                >
                    <Ionicons name="send" size={20} color="white" />
                </StyledTouchableOpacity>
            </StyledView>
        </KeyboardAvoidingView>
    );
}
