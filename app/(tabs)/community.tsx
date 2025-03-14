import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle, Heart, MoveVertical as MoreVertical } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';

type BookNote = Database['public']['Tables']['book_notes']['Row'] & {
  books: {
    title: string;
    author: string;
  };
};

export default function CommunityScreen() {
  const [notes, setNotes] = useState<BookNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingNote, setDeletingNote] = useState<string | null>(null);

  useEffect(() => {
    fetchSharedNotes();
  }, []);

  const fetchSharedNotes = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('book_notes')
        .select(`
          *,
          books (
            title,
            author
          )
        `)
        .not('shared_at', 'is', null)
        .order('shared_at', { ascending: false });

      if (fetchError) throw fetchError;

      setNotes(data as BookNote[]);
    } catch (err) {
      console.error('Error fetching shared notes:', err);
      setError('Failed to load shared notes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingNote(noteId);
              setError(null);

              const { error: updateError } = await supabase
                .from('book_notes')
                .update({ shared_at: null })
                .eq('id', noteId);

              if (updateError) throw updateError;

              setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
            } catch (err) {
              console.error('Error deleting post:', err);
              setError('Failed to delete post');
            } finally {
              setDeletingNote(null);
            }
          }
        }
      ]
    );
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - postDate.getTime());
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    if (diffWeeks < 4) return `${diffWeeks}w`;
    if (diffMonths < 12) return `${diffMonths}mo`;
    return `${diffYears}y`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Community</Text>
        <TouchableOpacity style={styles.chatButton}>
          <MessageCircle size={24} color="#10B981" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>Loading posts...</Text>
          </View>
        ) : error ? (
          <View style={styles.messageContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : notes.length === 0 ? (
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>No posts yet</Text>
          </View>
        ) : (
          <Animated.View layout={Layout}>
            {notes.map((note) => (
              <Animated.View
                key={note.id}
                style={styles.postCard}
                entering={FadeIn}
                layout={Layout}
              >
                <View style={styles.postHeader}>
                  <View style={styles.userInfo}>
                    <Image
                      source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400' }}
                      style={styles.avatar}
                    />
                    <View>
                      <Text style={styles.username}>Grace</Text>
                      <Text style={styles.timestamp}>
                        {formatTimeAgo(note.shared_at!)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.moreButton}
                    onPress={() => handleDelete(note.id)}
                    disabled={deletingNote === note.id}
                  >
                    <MoreVertical size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <View style={styles.postContent}>
                  <Text style={styles.bookTitle}>
                    {note.books.title}
                    <Text style={styles.bookAuthor}> by {note.books.author}</Text>
                  </Text>
                  <Text style={styles.noteText}>{note.content}</Text>
                </View>

                <View style={styles.postActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Heart size={20} color="#6B7280" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <MessageCircle size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  chatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    padding: 20,
    alignItems: 'center',
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#EF4444',
    textAlign: 'center',
  },
  postCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  username: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  timestamp: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  moreButton: {
    padding: 8,
    borderRadius: 20,
  },
  postContent: {
    marginBottom: 16,
  },
  bookTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  bookAuthor: {
    fontStyle: 'normal',
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  noteText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 24,
  },
  postActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
});