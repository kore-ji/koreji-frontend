import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Expo 內建圖標庫

// --- 定義資料型別 ---
interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string;
  subtasks: SubTask[];
}

// --- 假資料 ---
const MOCK_TASKS: Task[] = [
  {
    id: '1',
    title: '完成期末報告',
    description: '包含文獻回顧與數據分析',
    subtasks: [
      { id: '1-1', title: '找 5 篇相關論文', isCompleted: true },
      { id: '1-2', title: '撰寫第一章緒論', isCompleted: false },
    ],
  },
  {
    id: '2',
    title: '採購組員聚餐食材',
    description: '預算 2000 元內',
    subtasks: [
      { id: '2-1', title: '買飲料', isCompleted: false },
      { id: '2-2', title: '買披薩', isCompleted: false },
      { id: '2-3', title: '買紙杯', isCompleted: false },
    ],
  },
  {
    id: '3',
    title: '準備簡報',
    description: '下週三要報告',
    subtasks: [],
  },
];

export default function TasksScreen() {
  const router = useRouter();

  // 管理哪些任務是被「展開」的，存的是 Task ID
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // 處理點擊展開/收合
  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) {
      newSet.delete(id); // 如果已展開，就收起來
    } else {
      newSet.add(id);    // 如果沒展開，就展開
    }
    setExpandedIds(newSet);
  };

  // --- 渲染單個任務組件 ---
  const renderItem = ({ item }: { item: Task }) => {
    const isExpanded = expandedIds.has(item.id);

    return (
      <View style={styles.card}>
        {/* 主任務區塊 (點擊可展開) */}
        <TouchableOpacity
          style={styles.taskHeader}
          onPress={() => toggleExpand(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.taskInfo}>
            <Text style={styles.taskTitle}>{item.title}</Text>
            {item.description ? <Text style={styles.taskDesc}>{item.description}</Text> : null}
            <Text style={styles.subtaskCount}>
              {item.subtasks.length} 個子任務
            </Text>
          </View>

          {/* 箭頭圖示 (根據展開狀態變更方向) */}
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={24}
            color="#666"
          />
        </TouchableOpacity>

        {/* 子任務清單 (根據狀態顯示或隱藏) */}
        {isExpanded && (
          <View style={styles.subtaskList}>
            {item.subtasks.length > 0 ? (
              item.subtasks.map((sub) => (
                <View key={sub.id} style={styles.subtaskItem}>
                  <Ionicons
                    name={sub.isCompleted ? "checkbox" : "square-outline"}
                    size={20}
                    color={sub.isCompleted ? "#4CAF50" : "#999"}
                  />
                  <Text style={[
                    styles.subtaskText,
                    sub.isCompleted && styles.completedText
                  ]}>
                    {sub.title}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptySubtask}>無子任務</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>任務清單</Text>
      </View>

      <FlatList
        data={MOCK_TASKS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />

      {/* --- 右下角懸浮按鈕 (FAB) --- */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/add_task')} // 跳轉到新增頁面
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  taskDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  subtaskCount: {
    fontSize: 12,
    color: '#999',
  },
  subtaskList: {
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 10,
  },
  subtaskText: {
    fontSize: 15,
    color: '#444',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#aaa',
  },
  emptySubtask: {
    marginTop: 12,
    fontSize: 14,
    color: '#bbb',
    fontStyle: 'italic',
  },
  // --- FAB 樣式 ---
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2196f3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});