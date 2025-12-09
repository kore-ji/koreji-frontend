import React, { useState, useMemo } from 'react';
import {
  StyleSheet, View, Text, FlatList, TouchableOpacity, SafeAreaView, TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '@/hooks/use-responsive';

// --- 資料型別 ---
interface TaskItem {
  id: string;
  parentId: string | null;
  title: string;
  description: string;
  category?: string;
  estimatedTime: number;
  isCompleted: boolean;
  tags: {
    priority?: string;
    attention?: string;
    tools: string[];
    place?: string;
  };
}

// --- 初始假資料 ---
const INITIAL_TASKS: TaskItem[] = [
  
  {
    id: '101', parentId: '1', title: '找文獻', description: '至少五篇', estimatedTime: 60, isCompleted: true,
    tags: { priority: 'High', attention: 'Focus', tools: ['Computer'], place: 'Library' }
  },
  {
    id: '102', parentId: '1', title: '寫緒論', description: '', estimatedTime: 120, isCompleted: false,
    tags: { priority: 'Medium', attention: 'Focus', tools: ['Computer'], place: 'Dorm' }
  },
  {
    id: '2', parentId: null, title: '整理房間', description: '週末大掃除', category: 'Home', estimatedTime: 45, isCompleted: false,
    tags: { priority: 'Low', attention: 'Relax', tools: [], place: 'Home' }
  },
  {
    id: '1', parentId: null, title: '完成期末報告', description: '包含文獻回顧', category: 'School', estimatedTime: 0, isCompleted: false,
    tags: { tools: ['Computer'] }
  },
];

// --- [新組件] 可編輯文字欄位 ---
// 負責處理顯示文字 vs 輸入框的切換
interface EditableFieldProps {
  value: string;
  isNumeric?: boolean;
  textStyle?: any;
  containerStyle?: any;
  placeholder?: string;
  isReadOnly?: boolean;
  onSave: (newValue: string) => void;
}

const EditableField = ({
  value,
  isNumeric,
  textStyle,
  containerStyle,
  placeholder,
  isReadOnly = false,
  onSave
}: EditableFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  // 當外部資料改變時，同步更新內部暫存值
  React.useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleStartEdit = () => {
    if (isReadOnly) return;
    setIsEditing(true);
  };

  const handleSubmit = () => {
    setIsEditing(false);
    // 如果值有變才更新
    if (tempValue !== value) {
      onSave(tempValue);
    }
  };

  if (isEditing) {
    return (
      <View style={[containerStyle, styles.inputWrapper]}>
        <TextInput
          value={tempValue}
          onChangeText={setTempValue}
          onSubmitEditing={handleSubmit} // 按 Enter 觸發
          onBlur={handleSubmit} // 失去焦點也觸發儲存
          autoFocus
          keyboardType={isNumeric ? 'numeric' : 'default'}
          style={[textStyle, { padding: 0, minWidth: 40 }]} // 保持與原本文字樣式一致
          returnKeyType="done"
        />
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={handleStartEdit}
      style={containerStyle}
      activeOpacity={isReadOnly ? 1 : 0.6}
    >
      <Text style={[
        textStyle,
        isReadOnly && { opacity: 0.6 } // 唯讀時稍微淡一點
      ]}>
        {value || placeholder}
      </Text>
    </TouchableOpacity>
  );
};

export default function TasksScreen() {
  const router = useRouter();
  const responsive = useResponsive();

  // 1. 將資料轉為 State，這樣才能修改
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // 2. 更新任務資料的函式 (模擬 DB Update)
  const updateTaskField = (id: string, field: keyof TaskItem, value: any) => {
    setTasks(prevTasks => prevTasks.map(t => {
      if (t.id === id) {
        return { ...t, [field]: value };
      }
      return t;
    }));
    console.log(`[DB Update] Task ${id}: ${field} = ${value}`);
  };

  // 3. 資料結構轉換 (Flat -> Tree) 並動態計算時間
  const structuredTasks = useMemo(() => {
    const mainTasks = tasks.filter(t => t.parentId === null);

    return mainTasks.map(main => {
      const subtasks = tasks.filter(t => t.parentId === main.id);

      // 動態計算總時間 (如果子任務時間被修改，這裡會自動重算)
      let displayTime = main.estimatedTime;
      if (subtasks.length > 0) {
        displayTime = subtasks.reduce((sum, sub) => sum + sub.estimatedTime, 0);
      }

      return {
        ...main,
        displayTime, // 用於顯示的屬性
        subtasks
      };
    });
  }, [tasks]);

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedIds(newSet);
  };

  const renderItem = ({ item }: { item: TaskItem & { subtasks: TaskItem[], displayTime: number } }) => {
    const isExpanded = expandedIds.has(item.id);
    const hasSubtasks = item.subtasks.length > 0;

    // 計算進度
    const totalSub = item.subtasks.length;
    const completedSub = item.subtasks.filter(s => s.isCompleted).length;
    const progressPercent = totalSub > 0 ? (completedSub / totalSub) * 100 : (item.isCompleted ? 100 : 0);

    // Responsive styles
    const taskHeaderPadding = responsive.isMobile ? 16 : responsive.isTablet ? 20 : 24;
    const taskTitleSize = responsive.isMobile ? 18 : responsive.isTablet ? 20 : 22;
    const taskDescSize = responsive.isMobile ? 14 : responsive.isTablet ? 15 : 16;

    return (
      <View style={styles.card}>
        <View style={[styles.taskHeader, { padding: taskHeaderPadding }]}>

          {/* 上半部：類別與標題 */}
          <View style={styles.headerTop}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category || 'TASK'}</Text>
            </View>

            {/* 標題 (可編輯) */}
            <View style={{ flex: 1 }}>
              <EditableField
                value={item.title}
                textStyle={[styles.taskTitle, { fontSize: taskTitleSize }]}
                onSave={(val) => updateTaskField(item.id, 'title', val)}
              />
            </View>

            {/* 展開箭頭 */}
            {hasSubtasks && (
              <TouchableOpacity onPress={() => toggleExpand(item.id)} style={{ padding: 4 }}>
                <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {/* 描述 (可編輯) */}
          <EditableField
            value={item.description}
            placeholder="新增描述..."
            textStyle={[styles.taskDesc, { fontSize: taskDescSize }]}
            onSave={(val) => updateTaskField(item.id, 'description', val)}
          />

          {/* === Meta 資訊 (Tag & Time) === */}
          {/* 修改點：這裡不再把整個區塊隱藏，而是根據情況顯示內容 */}
          <View style={styles.tagsRow}>

            {/* 只有在「沒有子任務」時，才在這裡顯示可編輯的時間欄位 */}
            {/* 有子任務時，時間會顯示在下方的 totalTimeBadge，避免重複 */}
            {!hasSubtasks && (
              <>
                <Text style={styles.clockIcon}>⏱</Text>
                <EditableField
                  value={item.estimatedTime.toString()}
                  isNumeric
                  textStyle={styles.tagTime}
                  containerStyle={styles.timeTagContainer}
                  onSave={(val) => updateTaskField(item.id, 'estimatedTime', parseInt(val) || 0)}
                />
                <Text style={styles.tagUnit}>min</Text>
              </>
            )}

            {/* Tags 現在永遠顯示，無論是不是主任務 */}
            <TagsDisplay tags={item.tags} />
          </View>

          {/* 有子任務時顯示：進度條 + 總時間 (唯讀) */}
          {hasSubtasks && (
            <View style={styles.progressRow}>
              <View style={styles.progressContainer}>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                </View>
                <Text style={styles.progressText}>{Math.round(progressPercent)}%</Text>
              </View>

              {/* 這裡顯示加總後的時間 (唯讀) */}
              <View style={styles.totalTimeBadge}>
                <Text style={styles.totalTimeText}>總計 {item.displayTime} min</Text>
              </View>
            </View>
          )}
        </View>

        {/* 展開子任務 */}
        {isExpanded && hasSubtasks && (
          <View style={styles.subtaskList}>
            {item.subtasks.map((sub) => {
              const subtaskPaddingH = responsive.isMobile ? 16 : responsive.isTablet ? 20 : 24;
              const subtaskPaddingV = responsive.isMobile ? 12 : responsive.isTablet ? 14 : 16;
              return (
              <View key={sub.id} style={[styles.subtaskContainer, { paddingHorizontal: subtaskPaddingH, paddingVertical: subtaskPaddingV }]}>
                <View style={styles.subtaskRow}>
                  {/* 完成勾選 */}
                  <TouchableOpacity onPress={() => updateTaskField(sub.id, 'isCompleted', !sub.isCompleted)}>
                    <Ionicons
                      name={sub.isCompleted ? "checkbox" : "square-outline"}
                      size={24}
                      color={sub.isCompleted ? "#4CAF50" : "#999"}
                    />
                  </TouchableOpacity>

                  <View style={{ flex: 1, marginLeft: 8 }}>
                    {/* 子任務標題 (可編輯) */}
                    <EditableField
                      value={sub.title}
                      textStyle={[styles.subtaskText, sub.isCompleted && styles.completedText]}
                      onSave={(val) => updateTaskField(sub.id, 'title', val)}
                    />
                    {/* 子任務描述 (可編輯) */}
                    <EditableField
                      value={sub.description}
                      placeholder="無描述"
                      textStyle={styles.subtaskDesc}
                      onSave={(val) => updateTaskField(sub.id, 'description', val)}
                    />
                  </View>
                </View>

                {/* 子任務 Meta */}
                <View style={styles.tagsRow}>
                  <Text style={styles.clockIcon}>⏱</Text>
                  {/* 子任務時間 (可編輯) */}
                  <EditableField
                    value={sub.estimatedTime.toString()}
                    isNumeric
                    textStyle={styles.tagTime}
                    containerStyle={styles.timeTagContainer}
                    onSave={(val) => updateTaskField(sub.id, 'estimatedTime', parseInt(val) || 0)}
                  />
                  <Text style={styles.tagUnit}>min</Text>
                  <TagsDisplay tags={sub.tags} />
                </View>
              </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  // Responsive styles for header, list, and FAB
  const headerPadding = responsive.isMobile ? 20 : responsive.isTablet ? 24 : 32;
  const listPadding = responsive.isMobile ? 16 : responsive.isTablet ? 24 : 32;
  const fabSize = responsive.isMobile ? 60 : responsive.isTablet ? 64 : 68;
  const fabIconSize = responsive.isMobile ? 32 : responsive.isTablet ? 34 : 36;
  const headerTitleSize = responsive.isMobile ? 24 : responsive.isTablet ? 26 : 28;

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { padding: headerPadding }]}>
        <Text style={[styles.headerTitle, { fontSize: headerTitleSize }]}>Task List</Text>
      </View>
      <FlatList
        data={structuredTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, { padding: listPadding }]}
        keyboardShouldPersistTaps="handled" // 讓點擊輸入框外的區域能關閉鍵盤
      />
      <TouchableOpacity 
        style={[
          styles.fab, 
          { 
            width: fabSize, 
            height: fabSize, 
            borderRadius: fabSize / 2,
            right: responsive.isDesktop ? 32 : 20,
            bottom: responsive.isDesktop ? 40 : 30,
          }
        ]} 
        onPress={() => router.push('/add_task')}
      >
        <Ionicons name="add" size={fabIconSize} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// Tag 組件 (保持不變)
const TagsDisplay = ({ tags }: { tags: TaskItem['tags'] }) => (
  <>
    {tags.place && <View style={[styles.miniTag, { backgroundColor: '#E0F2F1' }]}><Text style={[styles.miniTagText, { color: '#00695C' }]}>{tags.place}</Text></View>}
    {tags.priority && <View style={[styles.miniTag, { backgroundColor: '#FFF3E0' }]}><Text style={[styles.miniTagText, { color: '#E65100' }]}>{tags.priority}</Text></View>}
    {tags.attention && <View style={[styles.miniTag, { backgroundColor: '#F3E5F5' }]}><Text style={[styles.miniTagText, { color: '#7B1FA2' }]}>{tags.attention}</Text></View>}
    {tags.tools.slice(0, 2).map(t => <View key={t} style={[styles.miniTag, { backgroundColor: '#E3F2FD' }]}><Text style={[styles.miniTagText, { color: '#1565C0' }]}>{t}</Text></View>)}
  </>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontWeight: 'bold', color: '#333' },
  listContent: { paddingBottom: 80 },
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, overflow: 'hidden', elevation: 2 },

  taskHeader: {},
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  categoryBadge: { backgroundColor: '#333', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginRight: 4 },
  categoryText: { fontSize: 10, fontWeight: 'bold', color: '#fff', textTransform: 'uppercase' },

  // Editable Styles
  inputWrapper: { borderBottomWidth: 1, borderBottomColor: '#2196f3', paddingBottom: 2 },
  taskTitle: { fontWeight: '600', color: '#333', paddingVertical: 2 },
  taskDesc: { color: '#666', marginBottom: 10, minHeight: 20 },

  // Progress & Time
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 12 },
  progressBarBg: { flex: 1, height: 6, backgroundColor: '#eee', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 3 },
  progressText: { fontSize: 12, color: '#888', width: 36, textAlign: 'right' },

  totalTimeBadge: { backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  totalTimeText: { fontSize: 12, fontWeight: '600', color: '#555' },

  // Subtasks
  subtaskList: { backgroundColor: '#FAFAFA', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingVertical: 4 },
  subtaskContainer: { borderBottomWidth: 1, borderBottomColor: '#eee' },
  subtaskRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  subtaskText: { fontSize: 15, color: '#333', fontWeight: '500' },
  subtaskDesc: { fontSize: 13, color: '#999', marginTop: 2 },
  completedText: { textDecorationLine: 'line-through', color: '#aaa' },

  // Tags & Time Editing
  tagsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 4 },
  timeTagContainer: { borderBottomWidth: 1, borderBottomColor: '#ccc' },
  tagTime: { fontSize: 13, color: '#333', fontWeight: '600', textAlign: 'center', minWidth: 20 },
  tagUnit: { fontSize: 12, color: '#888', marginRight: 4 },
  clockIcon: { fontSize: 12 },
  miniTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  miniTagText: { fontSize: 10, fontWeight: '600' },

  fab: { position: 'absolute', backgroundColor: '#2196f3', justifyContent: 'center', alignItems: 'center', elevation: 5 },
});