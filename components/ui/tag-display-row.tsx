import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface TaskTags {
    tagGroups: { [groupName: string]: string[] };
}

interface TagDisplayRowProps {
    tags: TaskTags;
    onEdit: () => void;
    tagGroupColors?: { [groupName: string]: { bg: string; text: string } };
}

// Default color mapping for different tag groups
const DEFAULT_TAG_GROUP_COLORS: { [key: string]: { bg: string; text: string } } = {
    Category: { bg: '#333333', text: '#FFFFFF' },
    Priority: { bg: '#FFF3E0', text: '#E65100' },
    Attention: { bg: '#F3E5F5', text: '#7B1FA2' },
    Tools: { bg: '#E3F2FD', text: '#1565C0' },
    Place: { bg: '#E0F2F1', text: '#00695C' },
};

export function TagDisplayRow({ tags, onEdit, tagGroupColors }: TagDisplayRowProps) {
    const colors = tagGroupColors || DEFAULT_TAG_GROUP_COLORS;
    return (
        <View style={styles.tagDisplayContainer}>
            <View style={styles.tagRow}>
                {tags.tagGroups && Object.entries(tags.tagGroups).map(([groupName, selectedTags]) =>
                    (selectedTags || []).map((tag: string) => {
                        const groupColors = colors[groupName] || { bg: '#E8F5E9', text: '#FFFFFF' };
                        return (
                            <View key={`${groupName}-${tag}`} style={[styles.miniTag, { backgroundColor: groupColors.bg }]}>
                                {groupName === 'Place' && (
                                    <Ionicons name="location" size={10} color="#FFFFFF" />
                                )}
                                <Text style={[styles.miniTagText, { color: '#FFFFFF' }]}>
                                    {tag}
                                </Text>
                            </View>
                        );
                    })
                )}
            </View>
            <TouchableOpacity style={styles.addTagBtn} onPress={onEdit}>
                <Ionicons name="add" size={18} color="#666" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    tagDisplayContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    tagRow: {
        flexDirection: 'row',
        gap: 6,
        flexWrap: 'wrap',
    },
    addTagBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    miniTag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    miniTagText: {
        fontSize: 11,
        fontWeight: '600',
    },
});
