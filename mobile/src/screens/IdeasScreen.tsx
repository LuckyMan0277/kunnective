import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { Idea } from '@kunnective/shared';

export default function IdeasScreen({ navigation }: any) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  useEffect(() => {
    loadIdeas(0, true);
  }, []);

  const loadIdeas = async (pageNumber: number, isRefresh = false) => {
    if (!isRefresh && !hasMore) return;

    try {
      const { data, error } = await supabase
        .from('ideas')
        .select(`
          *,
          author:users!ideas_author_id_fkey(id, name)
        `)
        .order('created_at', { ascending: false })
        .range(pageNumber * PAGE_SIZE, (pageNumber + 1) * PAGE_SIZE - 1);

      if (!error && data) {
        if (isRefresh) {
          setIdeas(data);
        } else {
          setIdeas((prev) => [...prev, ...data]);
        }
        setHasMore(data.length === PAGE_SIZE);
        setPage(pageNumber);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadIdeas(0, true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadIdeas(page + 1);
    }
  };

  const renderItem = ({ item }: { item: Idea }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('IdeaDetail', { id: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.status}>{getStatusLabel(item.status)}</Text>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.content} numberOfLines={3}>
        {item.description}
      </Text>
      <View style={styles.cardFooter}>
        <Text style={styles.author}>{item.author?.name}</Text>
        <Text style={styles.views}>👁 {item.view_count}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing && page === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={ideas}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          hasMore && ideas.length > 0 ? (
            <ActivityIndicator style={{ padding: 16 }} />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>아직 아이디어가 없습니다</Text>
          </View>
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateIdea')}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    recruiting: '모집중',
    in_progress: '진행중',
    completed: '완료',
    closed: '마감',
  };
  return labels[status] || status;
};

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
  list: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  category: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  status: {
    fontSize: 12,
    color: '#666',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  content: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  author: {
    fontSize: 12,
    color: '#666',
  },
  views: {
    fontSize: 12,
    color: '#666',
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
