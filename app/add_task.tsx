import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AddTaskScreen() {
    const router = useRouter();

    // 主任務狀態
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    // 子任務狀態 (暫存列表)
    const [subtasks, setSubtasks] = useState<{ id: string, title: string }[]>([]);
    const [currentSubtask, setCurrentSubtask] = useState(''); // 目前正在輸入的子任務

    // 新增子任務到列表
    const handleAddSubtask = () => {
        if (currentSubtask.trim().length === 0) return;

        const newSubtask = {
            id: Date.now().toString(), // 暫時用時間戳當 ID
            title: currentSubtask.trim()
        };

        setSubtasks([...subtasks, newSubtask]);
        setCurrentSubtask(''); // 清空輸入框
    };

    // 刪除子任務
    const removeSubtask = (id: string) => {
        setSubtasks(subtasks.filter(t => t.id !== id));
    };

    // 送出表單 (目前先 console.log)
    const handleSubmit = () => {
        const payload = {
            title,
            description,
            subtasks
        };
        console.log('準備傳給後端的資料:', payload);

        // 這裡未來要接 API

        router.back(); // 關閉頁面
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* 主任務標題 */}
                <Text style={styles.label}>任務標題</Text>
                <TextInput
                    style={styles.input}
                    placeholder="例如：完成期末報告"
                    value={title}
                    onChangeText={setTitle}
                />

                {/* 主任務描述 */}
                <Text style={styles.label}>任務描述 (選填)</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="補充說明..."
                    value={description}
                    onChangeText={setDescription}
                    multiline
                />

                {/* 子任務區塊 */}
                <Text style={styles.label}>子任務</Text>

                {/* 子任務輸入框 */}
                <View style={styles.subtaskInputContainer}>
                    <TextInput
                        style={[styles.input, styles.subtaskInput]}
                        placeholder="輸入子項目..."
                        value={currentSubtask}
                        onChangeText={setCurrentSubtask}
                        onSubmitEditing={handleAddSubtask} // 按 Enter 也可新增
                    />
                    <TouchableOpacity onPress={handleAddSubtask} style={styles.addSubtaskBtn}>
                        <Ionicons name="add-circle" size={36} color="#2196f3" />
                    </TouchableOpacity>
                </View>

                {/* 已新增的子任務列表 */}
                <View style={styles.subtaskList}>
                    {subtasks.map((item) => (
                        <View key={item.id} style={styles.subtaskItem}>
                            <Text style={styles.subtaskText}>• {item.title}</Text>
                            <TouchableOpacity onPress={() => removeSubtask(item.id)}>
                                <Ionicons name="close-circle" size={20} color="#ff4444" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

            </ScrollView>

            {/* 底部按鈕 */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                    <Text style={styles.submitBtnText}>建立任務</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        padding: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
        marginTop: 16,
    },
    input: {
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    // 子任務樣式
    subtaskInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    subtaskInput: {
        flex: 1,
    },
    addSubtaskBtn: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    subtaskList: {
        marginTop: 12,
        gap: 8,
    },
    subtaskItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 8,
    },
    subtaskText: {
        fontSize: 15,
        color: '#444',
    },
    // 底部按鈕
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    submitBtn: {
        backgroundColor: '#2196f3',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});