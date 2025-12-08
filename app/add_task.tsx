import React, { useState, useMemo } from 'react';
import {
    StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// --- 常數定義 ---
const CATEGORIES = ['School', 'Home', 'Work', 'Personal'];
const PRESET_PLACES = ['Classroom', 'Library', 'Home', 'Office', 'Coffee Shop'];
const TAG_OPTIONS = {
    priority: ['High', 'Medium', 'Low'],
    attention: ['Focus', 'Relax'],
    tools: ['Phone', 'iPad', 'Computer', 'Textbook'],
};

// --- 前端暫存用的型別 ---
interface LocalSubTask {
    id: string;
    title: string;
    description: string;
    estimatedTime: string;
    tags: {
        priority?: string;
        attention?: string;
        tools: string[];
        place?: string;
    };
}

export default function AddTaskScreen() {
    const router = useRouter();

    // --- 主任務狀態 ---
    const [mainTitle, setMainTitle] = useState('');
    const [mainDesc, setMainDesc] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [mainTime, setMainTime] = useState('');
    const [mainTags, setMainTags] = useState<LocalSubTask['tags']>({ tools: [] });

    // --- 子任務列表 ---
    const [subtasks, setSubtasks] = useState<LocalSubTask[]>([]);

    // --- Tag Modal 狀態 ---
    const [editingTarget, setEditingTarget] = useState<'main' | string | null>(null);
    const [tempTags, setTempTags] = useState<LocalSubTask['tags']>({ tools: [] });
    const [customPlace, setCustomPlace] = useState('');

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
        setCustomPlace('');
    };

    const saveTags = () => {
        const finalTags = { ...tempTags };
        if (customPlace.trim()) finalTags.place = customPlace.trim();

        if (editingTarget === 'main') {
            setMainTags(finalTags);
        } else if (typeof editingTarget === 'string') {
            setSubtasks(prev => prev.map(s => s.id === editingTarget ? { ...s, tags: finalTags } : s));
        }
        setEditingTarget(null);
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

    // --- Tag 顯示元件 ---
    const TagDisplayRow = ({ tags, onEdit }: { tags: LocalSubTask['tags'], onEdit: () => void }) => {
        return (
            <View style={styles.tagDisplayContainer}>
                <View style={styles.tagRow}>
                    {tags.priority && <View style={[styles.miniTag, { backgroundColor: '#FFF3E0' }]}><Text style={[styles.miniTagText, { color: '#E65100' }]}>{tags.priority}</Text></View>}
                    {tags.attention && <View style={[styles.miniTag, { backgroundColor: '#F3E5F5' }]}><Text style={[styles.miniTagText, { color: '#7B1FA2' }]}>{tags.attention}</Text></View>}
                    {tags.place && <View style={[styles.miniTag, { backgroundColor: '#E0F2F1' }]}><Ionicons name="location" size={10} color="#00695C" /><Text style={[styles.miniTagText, { color: '#00695C' }]}>{tags.place}</Text></View>}
                    {tags.tools.map(t => <View key={t} style={[styles.miniTag, { backgroundColor: '#E3F2FD' }]}><Text style={[styles.miniTagText, { color: '#1565C0' }]}>{t}</Text></View>)}
                </View>
                <TouchableOpacity style={styles.addTagBtn} onPress={onEdit}>
                    <Ionicons name="add" size={18} color="#666" />
                </TouchableOpacity>
            </View>
        );
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

                {/* === 子任務 Header 區域 (包含新按鈕) === */}
                <View style={styles.subtaskHeader}>
                    <Text style={styles.sectionTitle}>Subtasks</Text>

                    <View style={styles.headerActions}>
                        {/* --- AI Generate 按鈕 --- */}
                        <TouchableOpacity style={styles.aiButton} onPress={handleAIGenerate}>
                            <Ionicons name="sparkles" size={16} color="#fff" style={{ marginRight: 4 }} />
                            <Text style={styles.aiButtonText}>AI Generate</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={addSubtask}>
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

            {/* Modal (保持不變) */}
            <Modal visible={!!editingTarget} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Tags</Text>
                            <TouchableOpacity onPress={() => setEditingTarget(null)}><Ionicons name="close" size={24} color="#333" /></TouchableOpacity>
                        </View>
                        <ScrollView style={{ maxHeight: 400 }}>
                            <Text style={styles.modalLabel}>Priority</Text>
                            <View style={styles.chipContainer}>
                                {TAG_OPTIONS.priority.map(p => (
                                    <TouchableOpacity key={p} style={[styles.chip, styles.chipOutline, tempTags.priority === p && styles.chipPrioritySelected]} onPress={() => setTempTags({ ...tempTags, priority: tempTags.priority === p ? undefined : p })}><Text style={[styles.chipText, tempTags.priority === p && styles.chipTextSelected]}>{p}</Text></TouchableOpacity>
                                ))}
                            </View>
                            <Text style={styles.modalLabel}>Attention</Text>
                            <View style={styles.chipContainer}>{TAG_OPTIONS.attention.map(a => (<TouchableOpacity key={a} style={[styles.chip, styles.chipOutline, tempTags.attention === a && styles.chipAttentionSelected]} onPress={() => setTempTags({ ...tempTags, attention: tempTags.attention === a ? undefined : a })}><Text style={[styles.chipText, tempTags.attention === a && styles.chipTextSelected]}>{a}</Text></TouchableOpacity>))}</View>
                            <Text style={styles.modalLabel}>Tools</Text>
                            <View style={styles.chipContainer}>{TAG_OPTIONS.tools.map(t => (<TouchableOpacity key={t} style={[styles.chip, styles.chipOutline, tempTags.tools.includes(t) && styles.chipToolSelected]} onPress={() => toggleTool(t)}><Text style={[styles.chipText, tempTags.tools.includes(t) && styles.chipTextSelected]}>{t}</Text></TouchableOpacity>))}</View>
                            <Text style={styles.modalLabel}>Place</Text>
                            <View style={styles.chipContainer}>{PRESET_PLACES.map(p => (<TouchableOpacity key={p} style={[styles.chip, styles.chipOutline, tempTags.place === p && styles.chipPlaceSelected]} onPress={() => { setTempTags({ ...tempTags, place: tempTags.place === p ? undefined : p }); setCustomPlace(''); }}><Text style={[styles.chipText, tempTags.place === p && styles.chipTextSelected]}>{p}</Text></TouchableOpacity>))}</View>
                            <View style={styles.customPlaceRow}><Ionicons name="pencil" size={16} color="#666" /><TextInput style={styles.customPlaceInput} placeholder="Custom place..." value={customPlace} onChangeText={(text) => { setCustomPlace(text); if (text) setTempTags({ ...tempTags, place: undefined }); }} /></View>
                        </ScrollView>
                        <TouchableOpacity style={styles.modalSaveBtn} onPress={saveTags}><Text style={styles.submitBtnText}>Confirm</Text></TouchableOpacity>
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
    catScrollContent: { paddingBottom: 8, gap: 12 },
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

    // Subtask Header & AI Button
    subtaskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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
    modalLabel: { marginTop: 16, marginBottom: 8, fontWeight: '600', color: '#666' },
    chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chipOutline: { borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' },
    chipPrioritySelected: { backgroundColor: '#FF9800', borderColor: '#FF9800' },
    chipAttentionSelected: { backgroundColor: '#9C27B0', borderColor: '#9C27B0' },
    chipToolSelected: { backgroundColor: '#2196F3', borderColor: '#2196F3' },
    chipPlaceSelected: { backgroundColor: '#009688', borderColor: '#009688' },
    customPlaceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, padding: 10, backgroundColor: '#f5f5f5', borderRadius: 8 },
    customPlaceInput: { flex: 1 },
    modalSaveBtn: { marginTop: 24, backgroundColor: '#333', padding: 14, borderRadius: 12, alignItems: 'center' },
});