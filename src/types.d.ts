export type Task = {
    id: string;
    title: string;
    description: string | null;
    status?: 'active' | 'done' | 'archived'; 
    archived?: 0 | 1;
};

export type ColumnType = {
    id: string;
    title: string;
    tasks: Task[];
};

export type Board = {
    id: string;
    title: string;
    columns: ColumnType[];
};
