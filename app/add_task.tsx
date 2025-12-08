import React, { useState, useMemo } from 'react';
import {
    StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TagDisplayRow, type TaskTags } from '@/components/ui/tag-display-row';
import { TagSection } from '@/components/ui/tag-section';

// --- 常數定義 ---
const CATEGORIES = ['School', 'Home', 'Work', 'Personal'];
const INITIAL_PLACES = ['Classroom', 'Library', 'Home', 'Office', 'Coffee Shop'];
const TAG_OPTIONS = {
    priority: ['High', 'Medium', 'Low'],
    attention: ['Focus', 'Relax'],
    tools: ['Phone', 'iPad', 'Computer', 'Textbook'],
};

// --- 前端暫存用的型別 ---
interface LocalSubTask {
    id: string;
    title: string;
    description: string; // 新增描述欄位
    estimatedTime: string;
    tags: TaskTags;
}

export default function AddTaskScreen() {
    const router = useRouter();

    // --- 主任務狀態 ---
    const [mainTitle, setMainTitle] = useState('');
    const [mainDesc, setMainDesc] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [mainTime, setMainTime] = useState('');
    const [mainTags, setMainTags] = useState<TaskTags>({ tools: [] });

    // --- 子任務列表 ---
    const [subtasks, setSubtasks] = useState<LocalSubTask[]>([]);

    // --- Tag Modal 狀態 ---
    const [editingTarget, setEditingTarget] = useState<'main' | string | null>(null);
    const [tempTags, setTempTags] = useState<TaskTags>({ tools: [] });
    const [showPlaceInput, setShowPlaceInput] = useState(false);
    const [newPlaceName, setNewPlaceName] = useState('');
    const [places, setPlaces] = useState<string[]>(INITIAL_PLACES);

    // --- 時間計算邏輯 ---
    const calculatedTotalTime = useMemo(() => {
        if (subtasks.length === 0) return mainTime;
        const sum = subtasks.reduce((acc, curr) => acc + (parseInt(curr.estimatedTime) || 0), 0);
        return sum.toString();
    }, [subtasks, mainTime]);

    const isTimeReadOnly = subtasks.length > 0;

    // --- Tag 邏輯 ---
    const openTagModal = (target: 'main' | string) => {
        setEditingTarget(target);
        if (target === 'main') {
            setTempTags({ ...mainTags });
        } else {
            const sub = subtasks.find(s => s.id === target);
            if (sub) setTempTags({ ...sub.tags });
        }
        setShowPlaceInput(false);
        setNewPlaceName('');
    };

    const saveTags = () => {
        if (editingTarget === 'main') {
            setMainTags(tempTags);
        } else if (typeof editingTarget === 'string') {
            setSubtasks(prev => prev.map(s => s.id === editingTarget ? { ...s, tags: tempTags } : s));
        }
        setEditingTarget(null);
        setShowPlaceInput(false);
        setNewPlaceName('');
    };

    const handleAddNewPlace = () => {
        setShowPlaceInput(true);
    };

    const handleSaveNewPlace = () => {
        const trimmedPlace = newPlaceName.trim();
        if (trimmedPlace && !places.includes(trimmedPlace)) {
            // Add the new place to the list
            setPlaces(prev => [...prev, trimmedPlace]);
            // Set it as selected
            setTempTags({
                ...tempTags,
                place: trimmedPlace
            });
        } else if (trimmedPlace && places.includes(trimmedPlace)) {
            // If it already exists, just select it
            setTempTags({
                ...tempTags,
                place: trimmedPlace
            });
        }
        setShowPlaceInput(false);
        setNewPlaceName('');
    };

    const toggleTool = (tool: string) => {
        const currentTools = tempTags.tools || [];
        setTempTags({
            ...tempTags,
            tools: currentTools.includes(tool) ? currentTools.filter(t => t !== tool) : [...currentTools, tool]
        });
    };

    // --- 子任務操作 ---
    const addSubtask = () => {
        const newSub: LocalSubTask = {
            id: Date.now().toString(),
            title: '',
            description: '',
            estimatedTime: '',
            tags: { tools: [] }
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

                <TextInput
                    style={styles.mainInput}
                    placeholder="任務標題"
                    value={mainTitle}
                    onChangeText={setMainTitle}
                />

                <View style={styles.rowInput}>
                    <View style={{ width: 120 }}>
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
                    <View style={{ flex: 1, paddingLeft: 16 }}>
                        <Text style={styles.label}>Tags</Text>
                        <View style={{ marginTop: 8 }}>
                            <TagDisplayRow tags={mainTags} onEdit={() => openTagModal('main')} />
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

                {/* === 子任務 === */}
                <View style={styles.subtaskHeader}>
                    <Text style={styles.sectionTitle}>Subtasks</Text>
                    <TouchableOpacity onPress={addSubtask}>
                        <Text style={styles.addLink}>+ Add Subtask</Text>
                    </TouchableOpacity>
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
                                <TagDisplayRow tags={sub.tags} onEdit={() => openTagModal(sub.id)} />
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
                            {/* Priority Section */}
                            <TagSection
                                title="Priority"
                                options={TAG_OPTIONS.priority}
                                selectedValue={tempTags.priority}
                                onSelect={(value) => {
                                    setTempTags({
                                        ...tempTags,
                                        priority: tempTags.priority === value ? undefined : value
                                    });
                                }}
                                selectedStyle={styles.chipPrioritySelected}
                            />

                            {/* Attention Section */}
                            <TagSection
                                title="Attention"
                                options={TAG_OPTIONS.attention}
                                selectedValue={tempTags.attention}
                                onSelect={(value) => {
                                    setTempTags({
                                        ...tempTags,
                                        attention: tempTags.attention === value ? undefined : value
                                    });
                                }}
                                selectedStyle={styles.chipAttentionSelected}
                            />

                            {/* Tools Section */}
                            <TagSection
                                title="Tools"
                                options={TAG_OPTIONS.tools}
                                selectedValues={tempTags.tools}
                                onSelect={toggleTool}
                                selectedStyle={styles.chipToolSelected}
                                isMultiSelect={true}
                            />

                            {/* Place Section */}
                            <Text style={styles.modalLabel}>Place</Text>
                            <View style={styles.chipContainer}>
                                {places.map(p => (
                                    <TouchableOpacity
                                        key={p}
                                        style={[
                                            styles.chip,
                                            styles.chipOutline,
                                            tempTags.place === p && styles.chipPlaceSelected
                                        ]}
                                        onPress={() => {
                                            setTempTags({
                                                ...tempTags,
                                                place: tempTags.place === p ? undefined : p
                                            });
                                            setShowPlaceInput(false);
                                            setNewPlaceName('');
                                        }}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            tempTags.place === p && styles.chipTextSelected
                                        ]}>
                                            {p}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                                {showPlaceInput ? (
                                    <View style={styles.newPlaceInputContainer}>
                                        <TextInput
                                            style={styles.newPlaceInput}
                                            placeholder="New place..."
                                            value={newPlaceName}
                                            onChangeText={setNewPlaceName}
                                            autoFocus
                                            onSubmitEditing={handleSaveNewPlace}
                                        />
                                        <TouchableOpacity
                                            style={styles.savePlaceBtn}
                                            onPress={handleSaveNewPlace}
                                        >
                                            <Ionicons name="checkmark" size={16} color="#009688" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.cancelPlaceBtn}
                                            onPress={() => {
                                                setShowPlaceInput(false);
                                                setNewPlaceName('');
                                            }}
                                        >
                                            <Ionicons name="close" size={16} color="#666" />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={styles.addButton}
                                        onPress={handleAddNewPlace}
                                    >
                                        <Ionicons name="add" size={18} color="#666" />
                                    </TouchableOpacity>
                                )}
                            </View>
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
    catScrollContent: { paddingBottom: 8, gap: 12 }, // 增加 gap
    chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, backgroundColor: '#f0f0f0' },
    chipSelected: { backgroundColor: '#333' },
    chipText: { fontSize: 14, fontWeight: '500', color: '#333' },
    chipTextSelected: { color: '#fff' },

    mainInput: { fontSize: 24, fontWeight: '600', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee', marginBottom: 16, marginTop: 8 },
    label: { fontSize: 13, fontWeight: '600', color: '#888', marginBottom: 6 },

    rowInput: { flexDirection: 'row', marginBottom: 20 },
    timeBox: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff' },
    timeBoxDisabled: { backgroundColor: '#f5f5f5', borderColor: '#eee' },
    timeInput: { fontSize: 16, fontWeight: '600', color: '#333', textAlign: 'center' },

    input: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, fontSize: 16, borderWidth: 1, borderColor: '#eee' },
    textArea: { height: 80, textAlignVertical: 'top' },

    // Subtask Card Style (大幅優化)
    subtaskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 },
    addLink: { color: '#2196f3', fontWeight: '600' },
    subtaskList: { gap: 16 },
    subtaskCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#eee', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 2 } },

    // Row 1
    stRowTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    stTitleInput: { flex: 1, fontSize: 16, fontWeight: '500', color: '#333', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingVertical: 4 },
    stTimeContainer: { width: 60, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, backgroundColor: '#fafafa', paddingVertical: 2 }, // 顯眼的框框
    stTimeInput: { textAlign: 'center', fontSize: 14, color: '#333' },
    deleteBtn: { padding: 4, backgroundColor: '#f0f0f0', borderRadius: 12 },

    // Row 2
    stDescInput: { fontSize: 14, color: '#666', marginBottom: 12, paddingVertical: 4 },

    // Row 3
    stTagContainer: { paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f9f9f9' },


    footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#fff' },
    submitBtn: { backgroundColor: '#2196f3', padding: 16, borderRadius: 12, alignItems: 'center' },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    // Modal Styles (簡略)
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    chipPrioritySelected: { backgroundColor: '#FF9800', borderColor: '#FF9800' },
    chipAttentionSelected: { backgroundColor: '#9C27B0', borderColor: '#9C27B0' },
    chipToolSelected: { backgroundColor: '#2196F3', borderColor: '#2196F3' },
    chipPlaceSelected: { backgroundColor: '#009688', borderColor: '#009688' },
    modalLabel: { marginTop: 16, marginBottom: 8, fontWeight: '600', color: '#666' },
    chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chipOutline: { borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' },
    addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
    newPlaceInputContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#009688', borderRadius: 20, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8 },
    newPlaceInput: { minWidth: 100, fontSize: 14, color: '#333' },
    savePlaceBtn: { padding: 4 },
    cancelPlaceBtn: { padding: 4 },
    modalSaveBtn: { marginTop: 24, backgroundColor: '#333', padding: 14, borderRadius: 12, alignItems: 'center' },
});