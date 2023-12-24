<template>
  <a-form
    layout="vertical"
    :model="form"
    class="pr-form"
    @submit="handleSubmit"
  >
    <a-form-item field="title" label="PR标题">
      <a-input size="mini" v-model="form.title" placeholder="请输入PR标题" />
    </a-form-item>
    <a-form-item field="description" label="PR正文" class="pr-item">
      <a-space direction="vertical" fill size="medium">
        <!-- 模板位于项目根目录下的.gitlab/merge_request_templates文件下的md文件 -->
        <a-select
          size="mini"
          placeholder="选择PR正文模板"
          allow-search
          v-model="form.descriptionTemplate"
        >
          <a-option v-for="mergeTemplate of mergeRequestTemplateOptions">
            {{ mergeTemplate.fileName }}
          </a-option>
        </a-select>
        <div>
          <a-button
            style="margin-bottom: 6px"
            size="mini"
            @click="handleModeChange"
            >切换编辑/预览模式</a-button
          >
          <d-editor-md
            v-model="form.description"
            :mode="markdownMode"
            :md-rules="mdRules"
            base-url="https://test-base-url"
            :toolbarConfig="[
              ['bold', 'italic', 'strike'],
              ['ul', 'ol', 'checklist', 'code', 'link', 'image', 'table'],
            ]"
            :image-upload-to-server="true"
            @image-upload="imageUpload"
            @content-change="valueChange"
          ></d-editor-md>
        </div>
      </a-space>
    </a-form-item>
    <a-form-item field="source_branch" label="源分支">
      <a-select
        size="mini"
        v-model="form.source_branch"
        placeholder="请选择源分支"
        allow-search
      >
        <a-option v-for="branch of sourceBranchOptions">{{
          branch.name
        }}</a-option>
      </a-select>
    </a-form-item>
    <a-form-item field="target_branch" label="目标分支">
      <a-select
        size="mini"
        v-model="form.target_branch"
        placeholder="请选择目标分支"
        allow-search
      >
        <a-option v-for="branch of targetBranchOptions">{{
          branch.name
        }}</a-option>
      </a-select>
    </a-form-item>
    <a-form-item field="assignee" label="指定合并人">
      <a-select
        size="mini"
        v-model="form.assignee"
        placeholder="请选择合并人"
        allow-search
      >
        <a-option v-for="assignee of assigneeOptions">{{
          branch.name
        }}</a-option>
      </a-select>
    </a-form-item>
    <a-form-item class="merge-options-item" field="merge_options" style="margin-bottom: 0">
      <a-checkbox v-model="form.delete_branch"> 合并后删除源分支 </a-checkbox>
    </a-form-item>
    <a-form-item field="merge_options" class="merge-options-item squash-item">
      <a-checkbox v-model="form.squash"> 接受合并请求时压缩提交 </a-checkbox>
    </a-form-item>

    <a-form-item>
      <a-button type="primary" html-type="submit">立即提交PR</a-button>
    </a-form-item>
  </a-form>
</template>

<script lang="ts" setup>
import { reactive, ref, onMounted, watch } from "vue";
import { usePrMd } from "./hooks/pr-md";

const { imageUpload, valueChange } = usePrMd();
const markdownMode = ref("editonly");
const form = reactive({
  title: "",
  description: "",
  source_branch: "",
  target_branch: "",
  assignee: "",
  delete_branch: true,
  squash: false,
  descriptionTemplate: "",
});

const sourceBranchOptions = ref([]);
const targetBranchOptions = ref([]);
const assigneeOptions = ref([]);
const mergeRequestTemplateOptions = ref<{ fileName: string; data: string }[]>([]);

const vscode = window.acquireVsCodeApi?.();
const postMsg = (type, data) => vscode.postMessage({ type, data });
const oldState = vscode?.getState() ?? {};

watch(
  () => form.descriptionTemplate,
  (value) => {
    if (!value) {
      return;
    }

    form.description = mergeRequestTemplateOptions.value.find(
      (opt) => opt.fileName === value
    )?.data ?? '';
  },
  {
    immediate: true,
  }
);

window.addEventListener("message", ({ data }) => {
  const { type, payload } = data;
  if (!type || !payload) {
    return;
  }

  if (type === "initOptions") {
    mergeRequestTemplateOptions.value = payload?.mergeRequestTemplates || [];
  }
});

onMounted(() => {
  postMsg("init", oldState.repoPath);
});

const handleSubmit = (data) => {
  console.log(data);
};

const handleModeChange = () => {
  if (markdownMode.value === "editonly") {
    markdownMode.value = "readonly";
  } else {
    markdownMode.value = "editonly";
  }
};
</script>
<style>
@import url(./pr_form.css);
</style>
