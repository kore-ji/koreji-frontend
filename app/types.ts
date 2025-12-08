// 所有的 Tag 集合
export interface TaskTags {
    priority?: 'High' | 'Medium' | 'Low';
    attention?: 'Focus' | 'Relax';
    tools: string[];
    place?: string; // 允許自定義字串
}

// 資料庫中的單一 Row 結構
export interface TaskItem {
    id: string; // UUID
    parentId: string | null; // 區分主子任務的關鍵
    title: string;
    description: string;
    category: string | null; // 只有 parentId 為 null 時才有值
    estimatedTime: number; // 分鐘
    isCompleted: boolean;
    tags: TaskTags;
    createdAt: number;
}