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
            :custom-parse="mdCustomParse"
            v-if="mdBaseUrl"
            :base-url="mdBaseUrl"
            v-model="form.description"
            :mode="markdownMode"
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
        v-model="form.assignee_id"
        value-key="id"
        placeholder="请选择合并人"
        allow-search
        :loading="assigneeLoading"
        @search="handleSearchAssignee"
        :filter-option="false"
      >
        <a-option v-for="assignee of assigneeOptions">
          {{ assignee.name }}
        </a-option>
      </a-select>
    </a-form-item>
    <a-form-item
      class="merge-options-item"
      field="merge_options"
      style="margin-bottom: 0"
    >
      <a-checkbox v-model="form.remove_source_branch">
        合并后删除源分支
      </a-checkbox>
    </a-form-item>
    <a-form-item field="merge_options" class="merge-options-item squash-item">
      <a-checkbox v-model="form.allow_collaboration">
        接受合并请求时压缩提交
      </a-checkbox>
    </a-form-item>

    <a-form-item>
      <a-button type="primary" @click="submit">立即提交PR</a-button>
    </a-form-item>
  </a-form>
</template>

<script lang="ts" setup>
import { reactive, ref, onMounted, watch } from "vue";
import { uniqBy } from "lodash-es";
import { toRefs } from "vue";
import { MRParams } from "../../../src/type.js";

const markdownMode = ref("editonly");
const form = reactive<MRParams>({
  title: "",
  description: "",
  source_branch: "",
  target_branch: "",
  assignee_id: "",
  remove_source_branch: true,
  allow_collaboration: false,
  descriptionTemplate: "",
});

const assigneeLoading = ref(false);
const mdBaseUrl = ref("");

const sourceBranchOptions = ref([]);
const targetBranchOptions = ref([]);
const assigneeOptions = ref([]);
const mergeRequestTemplateOptions = ref<{ fileName: string; data: string }[]>(
  []
);

const vscode = window.acquireVsCodeApi?.();
const postMsg = (type, data) => vscode.postMessage({ type, data });
const oldState = vscode?.getState() ?? {};

watch(
  () => form.descriptionTemplate,
  (value) => {
    if (!value) {
      return;
    }

    form.description =
      mergeRequestTemplateOptions.value.find((opt) => opt.fileName === value)
        ?.data ?? "";
  },
  {
    immediate: true,
  }
);

let branches = [];
let currentBranchName = "";

window.addEventListener("message", (msg) => {
  const { type, data } = msg.data;

  if (!type) {
    return;
  }

  switch (type) {
    case "mergeRequestTemplates":
      mergeRequestTemplateOptions.value = data || [];
      break;
    case "branches":
      branches = data;
      updateBranches();
      break;
    case "currentBranch":
      currentBranchName = data;
      break;
    case "users":
      updateUsers(data);
      break;
    case "updateRepoTab":
      updateRepoTab(data);
      break;
    case "web_url":
      mdBaseUrl.value = data;
      break;
  }
});

function updateBranches() {
  setSourceBranch();
  setTargetBranch();
}

function setSourceBranch() {
  const { local, remote } = branches;
  if (local.find((item) => item.name === currentBranchName)) {
    form.source_branch = currentBranchName;
  }

  sourceBranchOptions.value = uniqBy([...local, ...remote], "name");
}

function setTargetBranch() {
  const { remote } = branches;
  targetBranchOptions.value = remote;
}

function updateUsers(users = []) {
  assigneeOptions.value = users;
  assigneeLoading.value = false;
}

function updateRepoTab(paths) {
  const state = vscode.getState();
  let repoPath = state.repoPath;
  if (paths.length > 1) {
    if (!repoPath || !paths.includes(repoPath)) {
      repoPath = paths[0];
    }
    vscode.setState({ ...oldState, repoPath });
  }
}

onMounted(() => {
  postMsg("init", oldState.repoPath);
});

const handleModeChange = () => {
  if (markdownMode.value === "editonly") {
    markdownMode.value = "readonly";
  } else {
    markdownMode.value = "editonly";
  }
};

async function handleSearchAssignee(value: string) {
  assigneeLoading.value = true;
  postMsg("searchUsers", value);
}

function convertFileToBase64(file: any) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = (error) => {
      reject(error);
    };
  });
}

const imageUpload = ({
  file,
  callback,
}: {
  file: any;
  callback: (url: any) => void;
}) => {
  let message;
  const rFilter =
    /^(image\/bmp|image\/gif|image\/jpge|image\/jpeg|image\/jpg|image\/png|image\/tiff)$/i;
  if (!rFilter.test(file.type)) {
    message = "Please choose bmp/jpg/jpge/png/gif/tiff type picture to upload";
  } else if (file.size / (1024 * 1024) > 10) {
    message = "Please choose a picture smaller than 10M to upload";
  }
  if (message) {
    return false;
  }

  new Promise(async (resolve) => {
    const fileStr = await convertFileToBase64(file);
    postMsg("uploadImage", {
      file: fileStr,
      type: file.type,
      name: file.name,
    });

    window.addEventListener("message", (msg) => {
      const { type, data } = msg.data;
      if (!data?.url) {
        return false;
      }

      if (type === "imageUploadedRes") {
        // todo baseUrl 不生效
        callback({ name: data.alt, imgUrl: data.url, title: data.alt });
        resolve(data);
      }
    });
  });
};
const mdCustomParse = (value: string) => {
  const newvalue = value.replace(
    /(<img\s+src=")([^"]+)(")/g,
    `$1${mdBaseUrl.value}$2$3`
  );
  return newvalue;
};
const valueChange = (val: string) => {
  console.log(val);
};

const submit = () => {
  const params = {
    ...form,
    assignee_id: assigneeOptions.value?.find(
      (item) => item.name === form.assignee_id
    )?.id,
  };

  delete params.descriptionTemplate;

  postMsg("submitMr", params);
};
</script>
<style>
@import url(./pr_form.css);
</style>
