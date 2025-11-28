import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { supabase } from '../lib/supabase';
import { ChatRoom, UserProfile, ChatParticipant } from '@kunnective/shared';
import { Avatar } from '../components/ui/Avatar';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

interface ChatRoomWithParticipants extends Omit<ChatRoom, 'participants'> {
    participants: (ChatParticipant & { user: UserProfile })[];
}

export default function ChatListScreen({ navigation }: any) {
    const [rooms, setRooms] = useState<ChatRoomWithParticipants[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

    useEffect(() => {
        loadCurrentUser();
    }, []);

    useEffect(() => {
        if (currentUser) {
            loadRooms();
        }
    }, [currentUser]);

    const loadCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setCurrentUser({ id: user.id } as UserProfile);
        }
    };

    const loadRooms = async () => {
        setRefreshing(true);

        try {
            const { data: participations, error } = await supabase
                .from('chat_participants')
                .select('room_id')
                .eq('user_id', currentUser?.id);

            if (participations && participations.length > 0) {
                const roomIds = participations.map(p => p.room_id);

                const { data: roomsData } = await supabase
                    .from('chat_rooms')
                    .select(`
            *,
            participants:chat_participants(
              user:users(*)
            )
          `)
                    .in('id', roomIds)
                    .order('updated_at', { ascending: false });

                if (roomsData) {
                    setRooms(roomsData as any);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        if (currentUser) {
            loadRooms();
        }
    };

    const renderItem = ({ item }: { item: ChatRoomWithParticipants }) => {
        const otherParticipant = item.participants.find(p => p.user.id !== currentUser?.id)?.user;

        if (!otherParticipant) return null;

        return (
            <StyledTouchableOpacity
                className="flex-row items-center p-4 bg-white border-b border-gray-100"
                onPress={() => navigation.navigate('ChatRoom', { roomId: item.id, otherUser: otherParticipant })}
            >
                <Avatar
                    src={otherParticipant.avatar_url}
                    fallback={otherParticipant.name || '?'}
                    size="md"
                    className="mr-3"
                />
                <StyledView className="flex-1">
                    <StyledView className="flex-row justify-between mb-1">
                        <StyledText className="font-semibold text-gray-900">
                            {otherParticipant.name}
                        </StyledText>
                        <StyledText className="text-xs text-gray-500">
                            {item.last_message_at ? new Date(item.last_message_at).toLocaleDateString() : ''}
                        </StyledText>
                    </StyledView>
                    <StyledText className="text-gray-600 text-sm" numberOfLines={1}>
                        {item.last_message || '대화를 시작해보세요'}
                    </StyledText>
                </StyledView>
            </StyledTouchableOpacity>
        );
    };

    if (loading && !refreshing) {
        return (
            <StyledView className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#007AFF" />
            </StyledView>
        );
    }

    return (
        <FlatList
            data={rooms}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ flexGrow: 1 }}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            ListEmptyComponent={
                <StyledView className="flex-1 items-center justify-center p-8">
                    <StyledText className="text-gray-500 text-center">
                        참여 중인 채팅방이 없습니다.
                    </StyledText>
                </StyledView>
            }
        />
    );
}
