import React, { useState, useMemo } from 'react';
import {
    StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TagDisplayRow, type TaskTags } from '@/components/ui/tag-display-row';
import { FilterDropdown } from '@/components/ui/filter-dropdown';

// --- 常數定義 ---
const CATEGORIES = ['School', 'Home', 'Work', 'Personal'];

// Tag groups configuration
const TAG_GROUPS: { [groupName: string]: { tags: string[]; isSingleSelect: boolean; allowAddTags: boolean; color: { bg: string; text: string } } } = {
    Priority: {
        tags: ['High', 'Medium', 'Low'],
        isSingleSelect: true,
        allowAddTags: false,
        color: { bg: '#BF360C', text: '#FFFFFF' },
    },
    Attention: {
        tags: ['Focus', 'Relax'],
        isSingleSelect: true,
        allowAddTags: false,
        color: { bg: '#4A148C', text: '#FFFFFF' },
    },
    Tools: {
        tags: ['Phone', 'iPad', 'Computer', 'Textbook'],
        isSingleSelect: false,
        allowAddTags: false,
        color: { bg: '#0D47A1', text: '#FFFFFF' },
    },
    Place: {
        tags: ['Classroom', 'Library', 'Home', 'Office', 'Coffee Shop'],
        isSingleSelect: true,
        allowAddTags: true,
        color: { bg: '#004D40', text: '#FFFFFF' },
    },
};

// Default tag group order (creation order)
const DEFAULT_TAG_GROUP_ORDER = ['Priority', 'Attention', 'Tools', 'Place'];

// Available colors for new tag groups
const TAG_GROUP_COLORS = [
    { bg: '#1B5E20', text: '#FFFFFF', name: 'Green' },
    { bg: '#BF360C', text: '#FFFFFF', name: 'Orange' },
    { bg: '#4A148C', text: '#FFFFFF', name: 'Purple' },
    { bg: '#0D47A1', text: '#FFFFFF', name: 'Blue' },
    { bg: '#004D40', text: '#FFFFFF', name: 'Teal' },
    { bg: '#880E4F', text: '#FFFFFF', name: 'Pink' },
    { bg: '#E65100', text: '#FFFFFF', name: 'Yellow' },
    { bg: '#01579B', text: '#FFFFFF', name: 'Light Blue' },
    { bg: '#33691E', text: '#FFFFFF', name: 'Light Green' },
    { bg: '#311B92', text: '#FFFFFF', name: 'Deep Purple' },
];

// --- 前端暫存用的型別 ---
interface LocalSubTask {
    id: string;
    title: string;
    description: string;
    estimatedTime: string;
    tags: TaskTags;
}

export default function AddTaskScreen() {
    const router = useRouter();
    const [useCategoryDropdown, setUseCategoryDropdown] = useState(false);

    // --- 主任務狀態 ---
    const [mainTitle, setMainTitle] = useState('');
    const [mainDesc, setMainDesc] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [mainTime, setMainTime] = useState('');
    const [mainTags, setMainTags] = useState<TaskTags>({ tagGroups: {} });

    // --- 子任務列表 ---
    const [subtasks, setSubtasks] = useState<LocalSubTask[]>([]);

    // --- Tag Modal 狀態 ---
    const [editingTarget, setEditingTarget] = useState<'main' | string | null>(null);
    const [tempTags, setTempTags] = useState<TaskTags>({ tagGroups: {} });
    // Tag groups structure: { [groupName: string]: string[] } - each group has its available tags
    const [tagGroups, setTagGroups] = useState<{ [groupName: string]: string[] }>(
        Object.fromEntries(Object.entries(TAG_GROUPS).map(([name, data]) => [name, data.tags]))
    );
    const [tagGroupOrder, setTagGroupOrder] = useState<string[]>(DEFAULT_TAG_GROUP_ORDER);
    const [tagGroupColors, setTagGroupColors] = useState<{ [groupName: string]: { bg: string; text: string } }>(
        Object.fromEntries(Object.entries(TAG_GROUPS).map(([name, data]) => [name, data.color]))
    );
    const [showTagGroupInput, setShowTagGroupInput] = useState(false);
    const [newTagGroupName, setNewTagGroupName] = useState('');
    const [editingTagInGroup, setEditingTagInGroup] = useState<{ groupName: string } | null>(null);
    const [newTagInGroupName, setNewTagInGroupName] = useState('');

    // --- 時間計算邏輯 ---
    const calculatedTotalTime = useMemo(() => {
        if (subtasks.length === 0) return mainTime;
        const sum = subtasks.reduce((acc, curr) => acc + (parseInt(curr.estimatedTime) || 0), 0);
        return sum.toString();
    }, [subtasks, mainTime]);

    const isTimeReadOnly = subtasks.length > 0;

    // --- AI 生成邏輯 (Placeholder) ---
    const handleAIGenerate = () => {
        if (!mainTitle.trim()) {
            Alert.alert('提示', '請先輸入任務標題，AI 才能幫您生成子任務喔！');
            return;
        }
        Alert.alert('AI Generate', '這裡未來會呼叫後端 API，根據標題自動生成 Subtasks。');
    };

    // --- Tag 邏輯 ---
    const openTagModal = (target: 'main' | string) => {
        setEditingTarget(target);
        if (target === 'main') {
            setTempTags({ ...mainTags });
        } else {
            const sub = subtasks.find(s => s.id === target);
            if (sub) setTempTags({ ...sub.tags });
        }
        setShowTagGroupInput(false);
        setNewTagGroupName('');
        setEditingTagInGroup(null);
        setNewTagInGroupName('');
    };

    const saveTags = () => {
        if (editingTarget === 'main') {
            setMainTags(tempTags);
        } else if (typeof editingTarget === 'string') {
            setSubtasks(prev => prev.map(s => s.id === editingTarget ? { ...s, tags: tempTags } : s));
        }
        setEditingTarget(null);
        setShowTagGroupInput(false);
        setNewTagGroupName('');
        setEditingTagInGroup(null);
        setNewTagInGroupName('');
    };

    const handleAddNewTagGroup = () => {
        setShowTagGroupInput(true);
    };

    const handleSaveNewTagGroup = () => {
        const trimmedTagGroup = newTagGroupName.trim();
        if (trimmedTagGroup && !tagGroups[trimmedTagGroup]) {
            // Create a new tag group category with empty tags array
            setTagGroups(prev => ({
                ...prev,
                [trimmedTagGroup]: []
            }));
            // Add to order array (at the end to maintain creation order)
            setTagGroupOrder(prev => [...prev, trimmedTagGroup]);
            
            // Automatically assign a color (rotate through available colors)
            const existingGroupNames = Object.keys(tagGroupColors);
            const usedColorIndices = existingGroupNames
                .map(name => TAG_GROUP_COLORS.findIndex(c => 
                    c.bg === tagGroupColors[name].bg && c.text === tagGroupColors[name].text
                ))
                .filter(idx => idx !== -1);
            
            // Find first unused color, or cycle through if all are used
            let colorIndex = 0;
            for (let i = 0; i < TAG_GROUP_COLORS.length; i++) {
                if (!usedColorIndices.includes(i)) {
                    colorIndex = i;
                    break;
                }
            }
            // If all colors are used, cycle through starting from 0
            const selectedColor = TAG_GROUP_COLORS[colorIndex % TAG_GROUP_COLORS.length];
            
            // Store the automatically selected color for this tag group
            setTagGroupColors(prev => ({
                ...prev,
                [trimmedTagGroup]: selectedColor
            }));
            // Initialize empty selected tags for this group
            const currentTagGroups = tempTags.tagGroups || {};
            setTempTags({
                ...tempTags,
                tagGroups: {
                    ...currentTagGroups,
                    [trimmedTagGroup]: []
                }
            });
        }
        setShowTagGroupInput(false);
        setNewTagGroupName('');
    };

    const toggleTagInGroup = (groupName: string, tag: string) => {
        const currentTagGroups = tempTags.tagGroups || {};
        const groupTags = currentTagGroups[groupName] || [];
        const groupConfig = TAG_GROUPS[groupName] || { isSingleSelect: false, allowAddTags: true };
        
        // Handle single-select groups
        let updatedGroupTags: string[];
        if (groupConfig.isSingleSelect) {
            // Single-select: replace with new tag or clear if same tag clicked
            updatedGroupTags = groupTags.includes(tag) ? [] : [tag];
        } else {
            // Multi-select: toggle tag
            updatedGroupTags = groupTags.includes(tag)
                ? groupTags.filter(t => t !== tag)
                : [...groupTags, tag];
        }
        
        setTempTags({
            ...tempTags,
            tagGroups: {
                ...currentTagGroups,
                [groupName]: updatedGroupTags
            }
        });
    };

    const handleAddTagToGroup = (groupName: string) => {
        setEditingTagInGroup({ groupName });
    };

    const handleSaveTagToGroup = () => {
        if (editingTagInGroup && newTagInGroupName.trim() && !tagGroups[editingTagInGroup.groupName]?.includes(newTagInGroupName.trim())) {
            setTagGroups(prev => ({
                ...prev,
                [editingTagInGroup.groupName]: [...(prev[editingTagInGroup.groupName] || []), newTagInGroupName.trim()]
            }));
        }
        setEditingTagInGroup(null);
        setNewTagInGroupName('');
    };

    // --- 子任務操作 ---
    const addSubtask = () => {
        const newSub: LocalSubTask = {
            id: Date.now().toString(),
            title: '',
            description: '',
            estimatedTime: '',
            tags: { tagGroups: {} }
        };
        setSubtasks([...subtasks, newSub]);
    };

    const updateSubtask = (id: string, field: keyof LocalSubTask, value: string) => {
        setSubtasks(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const removeSubtask = (id: string) => {
        setSubtasks(prev => prev.filter(s => s.id !== id));
    };

    // Check if category chips would overflow based on container width
    const handleCategoryContainerLayout = (event: any) => {
        const { width } = event.nativeEvent.layout;
        if (width > 0) {
            // Estimate total width needed for all chips
            // Each chip: horizontal padding (16*2 = 32px) + text width (varies by category name)
            // Gap between chips: 12px
            const chipPadding = 32; // 16px * 2
            const gap = 12;
            // Calculate estimated width for each category based on text length
            // Rough estimation: ~9px per character for font size 14, font weight 500
            const estimatedWidths = CATEGORIES.map(cat => {
                const estimatedTextWidth = cat.length * 9;
                return chipPadding + estimatedTextWidth;
            });
            const totalWidthNeeded = estimatedWidths.reduce((sum, w) => sum + w, 0) + (CATEGORIES.length - 1) * gap;
            // Add buffer (20px) to account for measurement variations and rounding
            setUseCategoryDropdown(totalWidthNeeded + 20 > width);
        }
    };

    // --- 送出資料 ---
    const handleSubmit = () => {
        if (!mainTitle.trim()) {
            Alert.alert('錯誤', '請輸入主任務標題');
            return;
        }

        const mainId = Date.now().toString();
        const createdAt = Date.now();

        const mainTaskPayload = {
            id: mainId,
            parentId: null,
            title: mainTitle,
            description: mainDesc,
            category,
            estimatedTime: parseInt(calculatedTotalTime) || 0,
            tags: mainTags,
            isCompleted: false,
            createdAt,
        };

        const subTaskPayloads = subtasks.map(sub => ({
            id: sub.id,
            parentId: mainId,
            title: sub.title || '未命名子任務',
            description: sub.description,
            category: null,
            estimatedTime: parseInt(sub.estimatedTime) || 0,
            tags: sub.tags,
            isCompleted: false,
            createdAt,
        }));

        const fullPayload = [mainTaskPayload, ...subTaskPayloads];
        console.log('單一資料表新增 payload:', JSON.stringify(fullPayload, null, 2));
        router.back();
    };


    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* === 主任務 === */}
                <Text style={styles.sectionTitle}>New Task</Text>

                <Text style={styles.label}>Category</Text>
                <View 
                    onLayout={handleCategoryContainerLayout}
                    style={styles.categoryContainer}
                >
                    {useCategoryDropdown ? (
                        // Dropdown when categories would overflow
                        <FilterDropdown
                            label=""
                            selectedValue={category}
                            options={CATEGORIES}
                            onSelect={(value) => setCategory(value as typeof CATEGORIES[number])}
                        />
                    ) : (
                        // Horizontal scroll chips when categories fit
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScrollContent}>
                            {CATEGORIES.map(cat => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[styles.chip, category === cat && styles.chipSelected]}
                                    onPress={() => setCategory(cat)}
                                >
                                    <Text style={[styles.chipText, category === cat && styles.chipTextSelected]}>{cat}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>

                <TextInput
                    style={styles.mainInput}
                    placeholder="任務標題"
                    value={mainTitle}
                    onChangeText={setMainTitle}
                />

                <View style={styles.rowInput}>
                    <View style={styles.timeContainer}>
                        <Text style={styles.label}>Time (min)</Text>
                        <View style={[styles.timeBox, isTimeReadOnly && styles.timeBoxDisabled]}>
                            <TextInput
                                style={[styles.timeInput, isTimeReadOnly && { color: '#888' }]}
                                keyboardType="numeric"
                                value={isTimeReadOnly ? calculatedTotalTime : mainTime}
                                onChangeText={setMainTime}
                                editable={!isTimeReadOnly}
                                placeholder="0"
                            />
                        </View>
                    </View>
                    <View style={styles.tagsContainer}>
                        <Text style={styles.label}>Tags</Text>
                        <View style={{ marginTop: 8 }}>
                            <TagDisplayRow tags={mainTags} onEdit={() => openTagModal('main')} tagGroupColors={tagGroupColors} />
                        </View>
                    </View>
                </View>

                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="描述 (選填)..."
                    value={mainDesc}
                    onChangeText={setMainDesc}
                    multiline
                />

                {/* === 子任務 Header 區域 (包含新按鈕) === */}
                <View style={styles.subtaskHeader}>
                    <Text style={styles.sectionTitle}>Subtasks</Text>

                    <View style={styles.headerActions}>
                        {/* --- AI Generate 按鈕 --- */}
                        <TouchableOpacity style={styles.aiButton} onPress={handleAIGenerate}>
                            <Ionicons name="sparkles" size={16} color="#fff" style={{ marginRight: 4 }} />
                            <Text style={styles.aiButtonText}>AI Generate</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={addSubtask} style={styles.addSubtaskButton}>
                            <Text style={styles.addLink}>+ Add Subtask</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.subtaskList}>
                    {subtasks.map((sub, index) => (
                        <View key={sub.id} style={styles.subtaskCard}>
                            {/* Row 1: Title, Time, Delete */}
                            <View style={styles.stRowTop}>
                                <TextInput
                                    style={styles.stTitleInput}
                                    placeholder={`子任務 ${index + 1}`}
                                    value={sub.title}
                                    onChangeText={(text) => updateSubtask(sub.id, 'title', text)}
                                />
                                <View style={styles.stTimeContainer}>
                                    <TextInput
                                        style={styles.stTimeInput}
                                        placeholder="Min"
                                        keyboardType="numeric"
                                        value={sub.estimatedTime}
                                        onChangeText={(text) => updateSubtask(sub.id, 'estimatedTime', text)}
                                    />
                                </View>
                                <TouchableOpacity onPress={() => removeSubtask(sub.id)} style={styles.deleteBtn}>
                                    <Ionicons name="close" size={18} color="#666" />
                                </TouchableOpacity>
                            </View>

                            {/* Row 2: Description */}
                            <TextInput
                                style={styles.stDescInput}
                                placeholder="新增子任務描述..."
                                value={sub.description}
                                onChangeText={(text) => updateSubtask(sub.id, 'description', text)}
                            />

                            {/* Row 3: Tags */}
                            <View style={styles.stTagContainer}>
                                <TagDisplayRow tags={sub.tags} onEdit={() => openTagModal(sub.id)} tagGroupColors={tagGroupColors} />
                            </View>
                        </View>
                    ))}
                </View>
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                    <Text style={styles.submitBtnText}>Create Task</Text>
                </TouchableOpacity>
            </View>
            {/* Tag Selection Modal */}
            <Modal visible={!!editingTarget} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Tags</Text>
                            <TouchableOpacity onPress={() => setEditingTarget(null)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: 400 }}>
    {/* All Tag Groups */}
    {tagGroupOrder.map(groupName => {
        const tags = tagGroups[groupName];
        if (!tags) return null;
        const groupConfig = TAG_GROUPS[groupName] || { isSingleSelect: false, allowAddTags: true };
        const isSingleSelect = groupConfig.isSingleSelect;
        const allowAddTags = groupConfig.allowAddTags;
        const selectedTags = tempTags.tagGroups?.[groupName] || [];
        const isSelected = isSingleSelect 
            ? selectedTags.length > 0 && selectedTags[0]
            : null;
        
        return (
            <View key={groupName}>
                <Text style={styles.modalLabel}>{groupName}</Text>
                <View style={styles.chipContainer}>
                    {tags.map(tag => {
                        const tagIsSelected = isSingleSelect
                            ? isSelected === tag
                            : selectedTags.includes(tag);
                        
                        // Get color for this tag group
                        const groupColor = tagGroupColors[groupName] || TAG_GROUP_COLORS[0];
                        const selectedStyle = {
                            backgroundColor: groupColor.bg,
                            borderColor: groupColor.text,
                        };
                        
                        return (
                            <TouchableOpacity
                                key={tag}
                                style={[
                                    styles.chip,
                                    styles.chipOutline,
                                    tagIsSelected && selectedStyle
                                ]}
                                onPress={() => toggleTagInGroup(groupName, tag)}
                            >
                                <Text style={[
                                    styles.chipText,
                                    tagIsSelected && styles.chipTextSelected
                                ]}>
                                    {tag}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                    {allowAddTags && (
                        editingTagInGroup?.groupName === groupName ? (
                            <View style={styles.newPlaceInputContainer}>
                                <TextInput
                                    style={styles.newPlaceInput}
                                    placeholder="New tag..."
                                    value={newTagInGroupName}
                                    onChangeText={setNewTagInGroupName}
                                    autoFocus
                                    onSubmitEditing={handleSaveTagToGroup}
                                />
                                <TouchableOpacity
                                    style={styles.savePlaceBtn}
                                    onPress={handleSaveTagToGroup}
                                >
                                    <Ionicons name="checkmark" size={16} color="#4CAF50" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.cancelPlaceBtn}
                                    onPress={() => {
                                        setEditingTagInGroup(null);
                                        setNewTagInGroupName('');
                                    }}
                                >
                                    <Ionicons name="close" size={16} color="#666" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={() => handleAddTagToGroup(groupName)}
                            >
                                <Ionicons name="add" size={18} color="#666" />
                            </TouchableOpacity>
                        )
                    )}
                </View>
            </View>
        );
    })}

    {/* Add New Tag Group */}
    {showTagGroupInput ? (
        <View style={styles.newPlaceInputContainer}>
            <TextInput
                style={styles.newPlaceInput}
                placeholder="New tag group name..."
                value={newTagGroupName}
                onChangeText={setNewTagGroupName}
                autoFocus
                onSubmitEditing={handleSaveNewTagGroup}
            />
            <TouchableOpacity
                style={styles.savePlaceBtn}
                onPress={handleSaveNewTagGroup}
            >
                <Ionicons name="checkmark" size={16} color="#4CAF50" />
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.cancelPlaceBtn}
                onPress={() => {
                    setShowTagGroupInput(false);
                    setNewTagGroupName('');
                }}
            >
                <Ionicons name="close" size={16} color="#666" />
            </TouchableOpacity>
        </View>
    ) : (
        <View style={[styles.chipContainer, { marginTop: 16 }]}>
            <TouchableOpacity
                style={styles.addTagGroupButton}
                onPress={handleAddNewTagGroup}
            >
                <Ionicons name="add" size={20} color="#4CAF50" />
            </TouchableOpacity>
        </View>
    )}
</ScrollView>


                        <TouchableOpacity style={styles.modalSaveBtn} onPress={saveTags}>
                            <Text style={styles.submitBtnText}>Confirm</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContent: { padding: 20 },
    sectionTitle: { fontSize: 22, fontWeight: '700', color: '#333', marginBottom: 16 },

    // Category Optimizations
    categoryContainer: { width: '100%' },
    catScrollContent: { paddingBottom: 8, gap: 12 },
    chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, backgroundColor: '#f0f0f0' },
    chipSelected: { backgroundColor: '#333' },
    chipText: { fontSize: 14, fontWeight: '500', color: '#333' },
    chipTextSelected: { color: '#FFFFFF' },

    mainInput: { fontSize: 24, fontWeight: '600', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee', marginBottom: 16, marginTop: 8 },
    label: { fontSize: 13, fontWeight: '600', color: '#888', marginBottom: 6 },

    rowInput: { flexDirection: 'row', marginBottom: 20, flexWrap: 'wrap', gap: 16 },
    timeContainer: { width: 120, minWidth: 120, flexShrink: 0 },
    tagsContainer: { flex: 1, minWidth: 200, flexShrink: 1 },
    timeBox: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff' },
    timeBoxDisabled: { backgroundColor: '#f5f5f5', borderColor: '#eee' },
    timeInput: { fontSize: 16, fontWeight: '600', color: '#333', textAlign: 'center' },

    input: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, fontSize: 16, borderWidth: 1, borderColor: '#eee' },
    textArea: { height: 80, textAlignVertical: 'top' },

    // Subtask Header & AI Button
    subtaskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 24, marginBottom: 12, flexWrap: 'wrap', gap: 12 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap', flexShrink: 1 },
    addSubtaskButton: { flexShrink: 0 },
    addLink: { color: '#2196f3', fontWeight: '600' },

    aiButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#9C27B0', // 紫色系代表 AI
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        elevation: 2,
        shadowColor: '#9C27B0',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        flexShrink: 0, // Prevent AI button from shrinking
    },
    aiButtonText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

    // Subtask List & Card
    subtaskList: { gap: 16 },
    subtaskCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#eee', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 2 } },

    stRowTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    stTitleInput: { flex: 1, fontSize: 16, fontWeight: '500', color: '#333', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingVertical: 4 },
    stTimeContainer: { width: 60, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, backgroundColor: '#fafafa', paddingVertical: 2 },
    stTimeInput: { textAlign: 'center', fontSize: 14, color: '#333' },
    deleteBtn: { padding: 4, backgroundColor: '#f0f0f0', borderRadius: 12 },

    stDescInput: { fontSize: 14, color: '#666', marginBottom: 12, paddingVertical: 4 },
    stTagContainer: { paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f9f9f9' },

    // Tag & Modal
    tagDisplayContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    tagRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    addTagBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
    miniTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 2 },
    miniTagText: { fontSize: 11, fontWeight: '600' },

    footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#fff' },
    submitBtn: { backgroundColor: '#2196f3', padding: 16, borderRadius: 12, alignItems: 'center' },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    chipPrioritySelected: { backgroundColor: '#FF9800', borderColor: '#FF9800' },
    chipAttentionSelected: { backgroundColor: '#9C27B0', borderColor: '#9C27B0' },
    chipToolSelected: { backgroundColor: '#2196F3', borderColor: '#2196F3' },
    chipPlaceSelected: { backgroundColor: '#009688', borderColor: '#009688' },
    chipTagGroupSelected: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
    modalLabel: { marginTop: 16, marginBottom: 8, fontWeight: '600', color: '#666' },
    chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chipOutline: { borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' },
    addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
    addTagGroupButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#4CAF50', borderStyle: 'dashed', marginLeft: 4 },
    newPlaceInputContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#009688', borderRadius: 20, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8 },
    newPlaceInput: { minWidth: 100, fontSize: 14, color: '#333' },
    savePlaceBtn: { padding: 4 },
    cancelPlaceBtn: { padding: 4 },
    modalSaveBtn: { marginTop: 24, backgroundColor: '#333', padding: 14, borderRadius: 12, alignItems: 'center' },
});