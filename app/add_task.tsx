import React, { useState, useMemo, useEffect } from 'react';
import {
    StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Alert, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TagDisplayRow, type TaskTags } from '@/components/ui/tag-display-row';
import { TASK_SCREEN_STRINGS } from '@/constants/strings/tasks';

// Import DateTimePicker
import DateTimePicker from '@react-native-community/datetimepicker';

// --- 常數定義 ---
const DEFAULT_CATEGORIES = ['School', 'Home', 'Work', 'Personal'];

// Tag groups configuration
const TAG_GROUPS: { [groupName: string]: { tags: string[]; isSingleSelect: boolean; allowAddTags: boolean; color: { bg: string; text: string } } } = {
    Category: {
        tags: DEFAULT_CATEGORIES,
        isSingleSelect: true,
        allowAddTags: true,
        color: { bg: '#333333', text: '#FFFFFF' },
    },
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
const DEFAULT_TAG_GROUP_ORDER = ['Category', 'Priority', 'Attention', 'Tools', 'Place'];

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

    // --- 主任務狀態 ---
    const [mainTitle, setMainTitle] = useState('');
    const [mainDesc, setMainDesc] = useState('');
    const [mainTime, setMainTime] = useState('');
    const [mainDeadline, setMainDeadline] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [mainTags, setMainTags] = useState<TaskTags>({ 
        tagGroups: { 
            Category: [DEFAULT_CATEGORIES[0]] 
        } 
    });

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

    // --- Date formatting ---
    const formatDate = (date: Date | null): string => {
        if (!date) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        console.log('[DEBUG] handleDateChange called:', {
            platform: Platform.OS,
            eventType: event?.type,
            selectedDate: selectedDate?.toISOString(),
            currentDeadline: mainDeadline?.toISOString(),
            event: JSON.stringify(event, null, 2),
        });

        if (Platform.OS === 'android') {
            // On Android, the picker closes automatically
            // event.type can be 'set', 'dismissed', or 'neutralButtonPressed'
            console.log('[DEBUG] Android - event.type:', event.type);
            if (event.type === 'set' && selectedDate) {
                console.log('[DEBUG] Android - Setting deadline to:', selectedDate.toISOString());
                setMainDeadline(selectedDate);
            } else {
                console.log('[DEBUG] Android - Not setting deadline. event.type:', event.type, 'selectedDate:', selectedDate?.toISOString());
            }
            setShowDatePicker(false);
        } else {
            // iOS: update date as user scrolls, but don't close until Done is pressed
            if (selectedDate) {
                console.log('[DEBUG] iOS - Updating deadline to:', selectedDate.toISOString());
                setMainDeadline(selectedDate);
            } else {
                console.log('[DEBUG] iOS - No selectedDate provided');
            }
        }
    };

    const handleDatePickerDone = () => {
        console.log('[DEBUG] handleDatePickerDone called. Current deadline:', mainDeadline?.toISOString());
        setShowDatePicker(false);
    };

    const handleDatePickerCancel = () => {
        console.log('[DEBUG] handleDatePickerCancel called. Deadline will remain:', mainDeadline?.toISOString());
        setShowDatePicker(false);
    };

    // Debug log when deadline state changes
    useEffect(() => {
        console.log('[DEBUG] mainDeadline state changed:', {
            deadline: mainDeadline?.toISOString(),
            formatted: mainDeadline ? formatDate(mainDeadline) : 'null',
        });
    }, [mainDeadline]);

    // Debug log when showDatePicker state changes
    useEffect(() => {
        console.log('[DEBUG] showDatePicker state changed:', showDatePicker);
    }, [showDatePicker]);

    // --- AI 生成邏輯 (Placeholder) ---
    const handleAIGenerate = () => {
        if (!mainTitle.trim()) {
            Alert.alert(
                TASK_SCREEN_STRINGS.addTask.alerts.aiGenerateTitle,
                TASK_SCREEN_STRINGS.addTask.alerts.aiGenerateMessage
            );
            return;
        }
        Alert.alert(
            TASK_SCREEN_STRINGS.addTask.alerts.aiGenerateAlertTitle,
            TASK_SCREEN_STRINGS.addTask.alerts.aiGeneratePlaceholder
        );
    };

    // --- Tag 邏輯 ---
    const openTagModal = (target: 'main' | string) => {
        setEditingTarget(target);
        if (target === 'main') {
            setTempTags({ ...mainTags });
        } else {
            const sub = subtasks.find(s => s.id === target);
            if (sub) {
                // Remove Category from subtask tags
                const { Category, ...subTagsWithoutCategory } = sub.tags.tagGroups || {};
                setTempTags({ tagGroups: subTagsWithoutCategory });
            }
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
            // Ensure Category is removed from subtask tags
            const { Category, ...tagsWithoutCategory } = tempTags.tagGroups || {};
            setSubtasks(prev => prev.map(s => s.id === editingTarget ? { ...s, tags: { tagGroups: tagsWithoutCategory } } : s));
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
            const trimmedTag = newTagInGroupName.trim();
            setTagGroups(prev => ({
                ...prev,
                [editingTagInGroup.groupName]: [...(prev[editingTagInGroup.groupName] || []), trimmedTag]
            }));
            
            // If adding to Category group and it's currently selected in tempTags, auto-select it
            if (editingTagInGroup.groupName === 'Category') {
                const currentTagGroups = tempTags.tagGroups || {};
                const groupConfig = TAG_GROUPS['Category'] || { isSingleSelect: true };
                if (groupConfig.isSingleSelect) {
                    // Auto-select the newly added category
                    setTempTags({
                        ...tempTags,
                        tagGroups: {
                            ...currentTagGroups,
                            Category: [trimmedTag]
                        }
                    });
                }
            }
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

    // --- 送出資料 ---
    const handleSubmit = () => {
        if (!mainTitle.trim()) {
            Alert.alert(
                TASK_SCREEN_STRINGS.addTask.alerts.errorTitle,
                TASK_SCREEN_STRINGS.addTask.alerts.errorMessage
            );
            return;
        }

        const mainId = Date.now().toString();
        const createdAt = Date.now();
        
        // Extract category from tags (Category tag group, first selected tag)
        const categoryFromTags = mainTags.tagGroups?.Category?.[0] || null;

        const mainTaskPayload = {
            id: mainId,
            parentId: null,
            title: mainTitle,
            description: mainDesc,
            category: categoryFromTags,
            estimatedTime: parseInt(calculatedTotalTime) || 0,
            deadline: mainDeadline ? formatDate(mainDeadline) : null,
            tags: mainTags,
            isCompleted: false,
            createdAt,
        };

        const subTaskPayloads = subtasks.map(sub => ({
            id: sub.id,
            parentId: mainId,
            title: sub.title || TASK_SCREEN_STRINGS.addTask.defaultUntitledSubtask,
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

                {/* Main Task Card - matching subtask structure */}
                <View style={[styles.subtaskCard, { marginBottom: 24 }]}>
                    {/* Row 1: Title */}
                    <View style={styles.stRowTop}>
                        <TextInput
                            style={styles.mainTaskTitleInput}
                            placeholder={TASK_SCREEN_STRINGS.addTask.taskTitlePlaceholder}
                            value={mainTitle}
                            onChangeText={setMainTitle}
                        />
                    </View>

                    {/* Row 2: Time and Deadline */}
                    <View style={styles.timeDeadlineRow}>
                        <View style={[styles.stTimeContainer, isTimeReadOnly && styles.timeBoxDisabled]}>
                            <TextInput
                                style={[styles.stTimeInput, isTimeReadOnly && { color: '#888' }]}
                                keyboardType="numeric"
                                value={isTimeReadOnly ? calculatedTotalTime : mainTime}
                                onChangeText={setMainTime}
                                editable={!isTimeReadOnly}
                                placeholder={TASK_SCREEN_STRINGS.addTask.minPlaceholder}
                            />
                        </View>
                        <TouchableOpacity 
                            style={styles.deadlineContainer}
                            onPress={() => {
                                console.log('[DEBUG] Deadline button pressed. Current deadline:', mainDeadline?.toISOString());
                                setShowDatePicker(true);
                            }}
                        >
                            <Text style={[styles.deadlineInput, !mainDeadline && styles.deadlinePlaceholder]}>
                                {mainDeadline ? formatDate(mainDeadline) : TASK_SCREEN_STRINGS.addTask.deadlinePlaceholder}
                            </Text>
                            <Ionicons name="calendar-outline" size={16} color="#666" style={{ marginLeft: 4 }} />
                        </TouchableOpacity>
                    </View>

                    {/* Row 2: Description */}
                    <TextInput
                        style={styles.stDescInput}
                        placeholder={TASK_SCREEN_STRINGS.addTask.descriptionPlaceholder}
                        value={mainDesc}
                        onChangeText={setMainDesc}
                        multiline
                    />

                    {/* Row 3: Tags */}
                    <View style={styles.stTagContainer}>
                        <Text style={styles.label}>{TASK_SCREEN_STRINGS.addTask.tagsLabel}</Text>
                        <View style={{ marginTop: 8 }}>
                            <TagDisplayRow tags={mainTags} onEdit={() => openTagModal('main')} tagGroupColors={tagGroupColors} />
                        </View>
                    </View>
                </View>

                {/* === 子任務 Header 區域 (包含新按鈕) === */}
                <View style={styles.subtaskHeader}>
                    <Text style={styles.sectionTitle}>{TASK_SCREEN_STRINGS.addTask.subtasksSectionTitle}</Text>

                    <View style={styles.headerActions}>
                        {/* --- AI Generate 按鈕 --- */}
                        <TouchableOpacity style={styles.aiButton} onPress={handleAIGenerate}>
                            <Ionicons name="sparkles" size={16} color="#fff" style={{ marginRight: 4 }} />
                            <Text style={styles.aiButtonText}>{TASK_SCREEN_STRINGS.addTask.aiGenerateButton}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={addSubtask} style={styles.addSubtaskButton}>
                            <Text style={styles.addLink}>{TASK_SCREEN_STRINGS.addTask.addSubtaskButton}</Text>
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
                                    placeholder={TASK_SCREEN_STRINGS.addTask.getSubtaskTitlePlaceholder(index + 1)}
                                    value={sub.title}
                                    onChangeText={(text) => updateSubtask(sub.id, 'title', text)}
                                />
                                <View style={styles.stTimeContainer}>
                                    <TextInput
                                        style={styles.stTimeInput}
                                        placeholder={TASK_SCREEN_STRINGS.addTask.minPlaceholder}
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
                                placeholder={TASK_SCREEN_STRINGS.addTask.subtaskDescriptionPlaceholder}
                                value={sub.description}
                                onChangeText={(text) => updateSubtask(sub.id, 'description', text)}
                            />

                            {/* Row 3: Tags */}
                            <View style={styles.stTagContainer}>
                                <Text style={styles.label}>{TASK_SCREEN_STRINGS.addTask.subtaskTagsLabel}</Text>
                                <View style={{ marginTop: 8 }}>
                                    <TagDisplayRow tags={sub.tags} onEdit={() => openTagModal(sub.id)} tagGroupColors={tagGroupColors} />
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                    <Text style={styles.submitBtnText}>{TASK_SCREEN_STRINGS.addTask.createTaskButton}</Text>
                </TouchableOpacity>
            </View>
            
            {/* Date Picker */}
            {showDatePicker && (
                <>
                    {Platform.OS === 'web' ? (
                        <Modal visible={showDatePicker} transparent animationType="fade">
                            <TouchableOpacity 
                                style={styles.modalOverlayCentered}
                                activeOpacity={1}
                                onPress={handleDatePickerCancel}
                            >
                                <TouchableOpacity 
                                    activeOpacity={1} 
                                    onPress={(e) => e.stopPropagation()}
                                >
                                    <View style={styles.datePickerContainerCentered}>
                                        <View style={styles.datePickerActions}>
                                            <TouchableOpacity onPress={handleDatePickerCancel}>
                                                <Text style={styles.datePickerCancel}>Cancel</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={handleDatePickerDone}>
                                                <Text style={styles.datePickerDone}>Done</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <View style={styles.webDateInputContainer}>
                                            <Text style={styles.webDateLabel}>Select Deadline:</Text>
                                            {Platform.OS === 'web' ? (
                                                // @ts-ignore - web only
                                                <input
                                                    type="date"
                                                    style={styles.webDateInputNative}
                                                    value={mainDeadline ? formatDate(mainDeadline) : ''}
                                                    min={new Date().toISOString().split('T')[0]}
                                                    onChange={(e) => {
                                                        console.log('[DEBUG] Web date input changed:', e.target.value);
                                                        if (e.target.value) {
                                                            const date = new Date(e.target.value + 'T00:00:00');
                                                            if (!isNaN(date.getTime())) {
                                                                setMainDeadline(date);
                                                            }
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <TextInput
                                                    style={styles.webDateInput}
                                                    value={mainDeadline ? formatDate(mainDeadline) : ''}
                                                    placeholder="YYYY-MM-DD"
                                                    onChangeText={(text) => {
                                                        console.log('[DEBUG] Date input changed:', text);
                                                        if (text) {
                                                            const date = new Date(text + 'T00:00:00');
                                                            if (!isNaN(date.getTime())) {
                                                                setMainDeadline(date);
                                                            }
                                                        }
                                                    }}
                                                />
                                            )}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </TouchableOpacity>
                        </Modal>
                    ) : Platform.OS === 'ios' ? (
                        <Modal visible={showDatePicker} transparent animationType="fade">
                            <TouchableOpacity 
                                style={styles.modalOverlayCentered}
                                activeOpacity={1}
                                onPress={handleDatePickerCancel}
                            >
                                <TouchableOpacity 
                                    activeOpacity={1} 
                                    onPress={(e) => e.stopPropagation()}
                                >
                                    <View style={styles.datePickerContainerCentered}>
                                        <View style={styles.datePickerActions}>
                                            <TouchableOpacity onPress={handleDatePickerCancel}>
                                                <Text style={styles.datePickerCancel}>Cancel</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={handleDatePickerDone}>
                                                <Text style={styles.datePickerDone}>Done</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <DateTimePicker
                                            value={mainDeadline || new Date()}
                                            mode="date"
                                            display="spinner"
                                            onChange={handleDateChange}
                                            minimumDate={new Date()}
                                        />
                                    </View>
                                </TouchableOpacity>
                            </TouchableOpacity>
                        </Modal>
                    ) : (
                        <DateTimePicker
                            value={mainDeadline || new Date()}
                            mode="date"
                            display="default"
                            onChange={handleDateChange}
                            minimumDate={new Date()}
                        />
                    )}
                </>
            )}
            
            {/* Tag Selection Modal */}
            <Modal visible={!!editingTarget} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{TASK_SCREEN_STRINGS.addTask.selectTagsTitle}</Text>
                            <TouchableOpacity onPress={() => setEditingTarget(null)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: 400 }}>
    {/* All Tag Groups */}
    {tagGroupOrder
        .filter(groupName => {
            // Exclude Category for subtasks
            if (editingTarget !== 'main' && groupName === 'Category') {
                return false;
            }
            return true;
        })
        .map(groupName => {
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
                        const selectedTextStyle = {
                            color: groupColor.text,
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
                                    tagIsSelected && selectedTextStyle
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
                                    placeholder={TASK_SCREEN_STRINGS.addTask.newTagPlaceholder}
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
                placeholder={TASK_SCREEN_STRINGS.addTask.newTagGroupPlaceholder}
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
                            <Text style={styles.submitBtnText}>{TASK_SCREEN_STRINGS.addTask.confirmButton}</Text>
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
    categoryContainer: { width: '100%', gap: 8 },
    categoryDropdownWrapper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    categoryChipsWrapper: { width: '100%' },
    catScrollContent: { paddingBottom: 8, gap: 12, alignItems: 'center' },
    chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, backgroundColor: '#f0f0f0' },
    chipSelected: { backgroundColor: '#333' },
    chipText: { fontSize: 14, fontWeight: '500', color: '#333' },
    chipTextSelected: { color: '#FFFFFF' },
    addCategoryChip: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderStyle: 'dashed',
    },
    addCategoryButtonSmall: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#CCCCCC',
    },

    mainInput: { fontSize: 24, fontWeight: '600', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee', marginBottom: 16, marginTop: 8 },
    label: { fontSize: 13, fontWeight: '600', color: '#888', marginBottom: 6 },

    timeContainer: { marginBottom: 20, width: 120 },
    tagsContainer: { marginBottom: 20 },
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
    mainTaskTitleInput: { flex: 1, fontSize: 20, fontWeight: '600', color: '#333', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingVertical: 4 },
    timeDeadlineRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    stTimeContainer: { width: 60, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, backgroundColor: '#fafafa', paddingVertical: 2 },
    stTimeInput: { textAlign: 'center', fontSize: 14, color: '#333' },
    deadlineContainer: { 
        flex: 1, 
        borderWidth: 1, 
        borderColor: '#ddd', 
        borderRadius: 6, 
        backgroundColor: '#fafafa', 
        paddingVertical: 2, 
        paddingHorizontal: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    deadlineInput: { fontSize: 14, color: '#333' },
    deadlinePlaceholder: { color: '#999' },
    datePickerContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    modalOverlayCentered: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    datePickerContainerCentered: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    datePickerActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        alignItems: 'center',
    },
    datePickerCancel: {
        color: '#666',
        fontSize: 16,
    },
    datePickerDone: {
        color: '#2196f3',
        fontSize: 16,
        fontWeight: '600',
    },
    webDateInputContainer: {
        paddingVertical: 8,
        gap: 8,
    },
    webDateLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    webDateInput: {
        fontSize: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
        color: '#333',
    },
    webDateInputNative: {
        fontSize: 12,
        padding: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
        color: '#333',
        width: '80%',
        fontFamily: 'inherit',
    },
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