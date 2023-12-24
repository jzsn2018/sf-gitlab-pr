/**
 * @file gitlab api
 */

import { handleResError } from '../utils';
import { MRParams, GitlabProject, GitlabBranch, GitlabUsers, CreateMrResponse, ExtensionConfig } from '../type';
import axios, { AxiosInstance } from 'axios';

class Api {
    id?: number;
    axios: AxiosInstance;
    project?: GitlabProject;

    constructor(configuration: ExtensionConfig) {
        this.axios = axios.create({
            headers: {
                'PRIVATE-TOKEN': configuration.token || ''
            },
            baseURL: configuration.instanceUrl?.replace(/\/$/, '') + '/api/v4',
            timeout: 5000,
        });
        this.axios.interceptors.request.use(function (config) {
            // console.log({
            //     request: {
            //         url: config.url,
            //         params: config.params
            //     }
            // });
            return config;
        });
        this.axios.interceptors.response.use(function (res) {
            return res;
        }, function (err) {
            const content = err?.response?.data;
            handleResError(content || err.message);
            return Promise.reject(err);
        });
    }

    getProject(name: string, url = '') {
        return this.axios.get<GitlabProject[]>(`/projects`, {
            params: {
                search: name,
            }
        }).then(res => {
            if (res.data.length) {
                const result = res.data.find(item => item['http_url_to_repo'] === url);
                this.project = result || res.data[0] || {};
                this.id = this.project.id;
            }
        });
    }

    getBranches() {
        return this.axios.get<GitlabBranch[]>(`/projects/${this.id}/repository/branches`);
    }

    getUsers(name?: string) {
        return this.axios.get<GitlabUsers[]>('/users', {
            params: {
                active: true,
                project_id: this.id,
                per_page: 20,
                search: name,
            }
        });
    }

    uploadImage(file: any) {
        // https://docs.gitlab.com/ee/api/projects.html#upload-a-file
        return this.axios.post(`/projects/${this.id}/uploads`, file, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }

    submitMR(data: MRParams) {
        return this.axios.post<CreateMrResponse>(`/projects/${this.id}/merge_requests`, data);
    }
}

export default Api;
