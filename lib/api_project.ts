import { apiRequest, request } from './api_client';

// 项目相关接口类型定义
export interface ClassCode {
    id: number;
    name: string;
    class_code: string;
    position: number;
}

export interface ApiConfig {
    id: number;
    name: string;
    app_addr: string;
    model_type: number;
    is_delete: boolean;
    class_code_key: string;
}

export interface Config {
    id: number;
    name: string;
    class_codes?: ClassCode[];
    api_configs: ApiConfig[];
}

export interface ProjectDetail {
    id: number;
    name: string;
    logo_path: string;
    is_delete: boolean;
    longitude: number;
    latitude: number;
    altitude: number;
    configs: Config[];
}

export interface ModelTypeConfig {
    id: number;
    name: string;
    class_codes: ClassCode[];
    api_configs: ApiConfig[];
}

export interface CreateProjectRequest {
    name: string;
    logo_path: string;
    longitude: number;
    latitude: number;
    altitude: number;
    api_config_ids: number[];
    class_code_config_ids: number[];
}

export interface UpdateProjectRequest {
    project_id: number;
    name: string;
    logo_path: string;
    longitude: number;
    latitude: number;
    altitude: number;
    api_config_ids: number[];
    class_code_config_ids: number[];
}

export interface SetDefaultProject {
    id: number;  // user_id
    project_id: number;
}

// 项目API函数
export const projectApi = {
    // 获取项目详情
    getProjectDetail: async (projectId: number): Promise<ProjectDetail> => {
        return apiRequest<ProjectDetail>({
            url: `/project/all_configs?project_id=${projectId}`,
            method: 'GET',
        });
    },

    // 获取模型类型配置列表
    getModelTypeConfigs: async (): Promise<ModelTypeConfig[]> => {
        return apiRequest<ModelTypeConfig[]>({
            url: '/ai_config/model_type_list_more',
            method: 'GET',
        });
    },

    // 创建项目
    createProject: async (data: CreateProjectRequest): Promise<void> => {
        await apiRequest<void>({
            url: '/project/create',
            method: 'POST',
            data,
        });
    },

    // 更新项目
    updateProject: async (data: UpdateProjectRequest): Promise<void> => {
        await apiRequest<void>({
            url: '/project/update',
            method: 'POST',
            data,
        });
    },

    // 删除项目
    deleteProject: async (projectId: number): Promise<void> => {
        await apiRequest<void>({
            url: `/project/delete?project_id=${projectId}`,
            method: 'GET',
        });
    },

    // 获取项目列表（兼容旧版本API调用）
    getProjectList: async (page: number = 1, pageSize: number = 10): Promise<any> => {
        const response = await request<any>({
            url: '/project/list',
            method: 'GET',
            params: { page, pageSize },
        });
        return response.data;
    },

    // 删除项目
    setDelaultProject: async (data: SetDefaultProject): Promise<void> => {
        await apiRequest<void>({
            url: '/user/set_default_project',
            method: 'POST',
            data,
        });
    },
};