import { request, type ApiResponse as BaseApiResponse } from './api_user';

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

export interface ApiResponse<T> {
    code: number;
    msg: string;
    data: T;
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

// 项目API函数
export const projectApi = {
    // 获取项目详情
    getProjectDetail: async (projectId: number): Promise<ApiResponse<ProjectDetail>> => {
        const response = await request<ProjectDetail>({
            url: `/project/all_configs?project_id=${projectId}`,
            method: 'GET',
        });
        return response.data;
    },

    // 获取模型类型配置列表
    getModelTypeConfigs: async (): Promise<ApiResponse<ModelTypeConfig[]>> => {
        const response = await request<ModelTypeConfig[]>({
            url: '/ai_config/model_type_list_more',
            method: 'GET',
        });
        return response.data;
    },

    // 创建项目
    createProject: async (data: CreateProjectRequest): Promise<ApiResponse<null>> => {
        const response = await request<null>({
            url: '/project/create',
            method: 'POST',
            data,
        });
        return response.data;
    },

    // 更新项目
    updateProject: async (data: UpdateProjectRequest): Promise<ApiResponse<null>> => {
        const response = await request<null>({
            url: '/project/update',
            method: 'POST',
            data,
        });
        return response.data;
    },

    // 删除项目
    deleteProject: async (projectId: number): Promise<ApiResponse<null>> => {
        const response = await request<null>({
            url: `/project/delete?project_id=${projectId}`,
            method: 'GET',
        });
        return response.data;
    },
};