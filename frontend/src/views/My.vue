<template>
  <div class="my-page-wrapper">
    <section class="profile-block">
      <div class="radio-wrapper">
        <span class="tag current">{{ env.runtime || env.backend || "Cloudflare" }}</span>
        <div class="storage-language-switch">
          <LanguageSwitcherButton />
        </div>
      </div>
      <div class="info">
        <div class="avatar-wrapper">
          <nut-avatar
            size="72"
            bg-color="var(--card-color)"
            :url="icon"
            class="auto-reverse"
          />
          <div class="name">
            <p class="title">{{ appName }}</p>
            <p class="des">
              <span class="des-line1">{{ t("myPage.profile.desc") }}</span>
              <span class="des-line2">{{ env.storage || "D1" }} · v{{ env.version || "-" }}</span>
            </p>
          </div>
        </div>
        <div class="actions">
          <input ref="fileInput" type="file" accept="application/json,.json" @change="restoreFromFile" />
          <nut-button plain type="primary" size="small" :loading="restoreIsLoading" @click="selectBackupFile">
            <font-awesome-icon v-if="!restoreIsLoading" icon="fa-solid fa-cloud-arrow-up" />
            {{ t("myPage.backup.restore") }}
          </nut-button>
          <nut-button type="primary" size="small" :loading="exportIsLoading" @click="exportBackup">
            <font-awesome-icon v-if="!exportIsLoading" icon="fa-solid fa-cloud-arrow-down" />
            {{ t("myPage.backup.export") }}
          </nut-button>
        </div>
      </div>
    </section>

    <!-- Backup Card -->
    <section class="config-card storage-card">
      <div class="title-wrapper">
        <h1>{{ t("myPage.backup.title") }}</h1>
      </div>
      <p class="card-desc">{{ t("myPage.backup.desc") }}</p>
    </section>

    <!-- Templates Card -->
    <section class="config-card">
      <div class="title-wrapper">
        <h1>{{ t("myPage.templates.title") }}</h1>
        <div class="storage-actions">
          <input ref="templateFileInput" type="file" accept="application/json,.json,.yaml,.yml,text/yaml" @change="importTemplateFromFile" />
          <nut-button plain type="primary" size="small" :loading="templateImporting" @click="selectTemplateFile">
            <font-awesome-icon v-if="!templateImporting" icon="fa-solid fa-file-import" />
            {{ t("myPage.templates.importFile") }}
          </nut-button>
          <nut-button type="primary" size="small" :loading="templateImporting" @click="openTemplateImport">
            <font-awesome-icon v-if="!templateImporting" icon="fa-solid fa-plus" />
            {{ t("myPage.templates.create") }}
          </nut-button>
        </div>
      </div>

      <!-- Skeleton pulse loader for templates -->
      <div v-if="loadingTemplates" class="template-card-list">
        <div class="template-card skeleton-card skeleton-pulse">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-content">
            <div class="skeleton-line title"></div>
            <div class="skeleton-line sub"></div>
          </div>
        </div>
        <div class="template-card skeleton-card skeleton-pulse">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-content">
            <div class="skeleton-line title"></div>
            <div class="skeleton-line sub"></div>
          </div>
        </div>
      </div>

      <!-- Template Feature Cards -->
      <div v-else class="template-card-list">
        <div v-for="template in templates" :key="template.name" class="template-card">
          <div class="template-icon-badge">
            <font-awesome-icon icon="fa-solid fa-code" />
          </div>
          <div class="template-info">
            <div class="template-header-line">
              <span class="template-title">{{ template.displayName || template.name }}</span>
              <nut-tag :type="template.readonly ? 'warning' : 'primary'" plain>
                {{ template.readonly ? t("myPage.templates.builtIn") : t("myPage.templates.custom") }}
              </nut-tag>
            </div>
            <span class="template-target-pill">
              {{ getTargetLabel(template.target || "mihomo") }}
            </span>
          </div>
          <div class="template-actions">
            <nut-button v-if="!template.readonly" plain type="primary" size="mini" @click="openTemplateEdit(template)">
              {{ t("myPage.btn.edit") }}
            </nut-button>
            <nut-button v-if="!template.readonly" plain type="danger" size="mini" @click="deleteCustomTemplate(template.name)">
              {{ t("myPage.btn.delete") }}
            </nut-button>
          </div>
        </div>
      </div>
    </section>

    <!-- Request Settings Card -->
    <section class="config-card">
      <div class="title-wrapper" @click="requestEditing ? cancelRequestEdit() : startRequestEdit()">
        <h1>{{ t("myPage.request.title") }}</h1>
        <div class="config-btn-wrapper">
          <template v-if="requestEditing">
            <nut-button class="cancel-btn" plain type="info" size="mini" :disabled="requestSaving" @click.stop="cancelRequestEdit">
              <font-awesome-icon icon="fa-solid fa-ban" />
              {{ t("myPage.btn.cancel") }}
            </nut-button>
            <nut-button class="save-btn" type="primary" size="mini" :loading="requestSaving" @click.stop="saveRequestSettings">
              <font-awesome-icon v-if="!requestSaving" icon="fa-solid fa-floppy-disk" />
              {{ t("myPage.btn.save") }}
            </nut-button>
          </template>
          <nut-icon v-else class="right-icon" name="right"></nut-icon>
        </div>
      </div>

      <!-- Modernized Request Settings Form Grid -->
      <div v-if="requestEditing" class="settings-form-grid">
        <div class="form-field-group">
          <label class="form-field-label">{{ t("myPage.request.defaultUserAgent") }}</label>
          <input
            v-model="requestForm.defaultUserAgent"
            class="settings-input"
            type="text"
            :placeholder="t('myPage.request.defaultUserAgent')"
          />
        </div>

        <div class="form-field-group">
          <label class="form-field-label">{{ t("myPage.request.defaultFlowUserAgent") }}</label>
          <input
            v-model="requestForm.defaultFlowUserAgent"
            class="settings-input"
            type="text"
            :placeholder="t('myPage.request.defaultFlowUserAgent')"
          />
        </div>

        <div class="form-field-group">
          <label class="form-field-label">{{ t("myPage.request.defaultTimeout") }}</label>
          <input
            v-model="requestForm.defaultTimeout"
            class="settings-input"
            type="number"
            :placeholder="t('myPage.request.defaultTimeout')"
          />
        </div>

        <div class="form-field-group">
          <label class="form-field-label">{{ t("myPage.request.backendRequestConcurrency") }}</label>
          <input
            v-model="requestForm.backendRequestConcurrency"
            class="settings-input"
            type="number"
            :placeholder="t('myPage.request.backendRequestConcurrency')"
          />
        </div>

        <div class="form-field-group">
          <label class="form-field-label">{{ t("myPage.request.backendRequestConcurrencyWaitTime") }}</label>
          <input
            v-model="requestForm.backendRequestConcurrencyWaitTime"
            class="settings-input"
            type="number"
            :placeholder="t('myPage.request.backendRequestConcurrencyWaitTime')"
          />
        </div>

        <div class="form-field-group">
          <label class="form-field-label">{{ t("myPage.request.remoteCacheTtl") }}</label>
          <input
            v-model="requestForm.remoteCacheTtl"
            class="settings-input"
            type="number"
            :placeholder="t('myPage.request.remoteCacheTtl')"
          />
        </div>

        <div class="form-field-group form-field-group--full">
          <label class="form-field-label">{{ t("myPage.request.nodeInfoApiUrl") }}</label>
          <input
            v-model="requestForm.nodeInfoApiUrl"
            class="settings-input"
            type="text"
            :placeholder="t('myPage.request.nodeInfoApiUrl')"
          />
        </div>

        <div class="toggle-card-row form-field-group--full">
          <span class="toggle-card-title">{{ t('myPage.request.remoteCacheStaleOnError') }}</span>
          <nut-switch v-model="requestForm.remoteCacheStaleOnError" />
        </div>
      </div>
      <p v-else class="card-desc">{{ requestSummary }}</p>
    </section>

    <nut-popup v-model:visible="templateImportVisible" position="right" pop-class="side-drawer-popup template-drawer-popup" closeable :style="{ width: isMobile() ? '88%' : '440px', height: '100%', padding: '24px 18px' }">
      <div class="template-import-panel">
        <h2>{{ templateEditingId ? t("myPage.templates.editTitle") : t("myPage.templates.importTitle") }}</h2>
        <nut-input class="input" v-model.trim="templateForm.id" :placeholder="t('myPage.templates.idPlaceholder')" input-align="left" :disabled="Boolean(templateEditingId)" />
        <nut-input class="input" v-model.trim="templateForm.name" :placeholder="t('myPage.templates.namePlaceholder')" input-align="left" />
        <nut-cell class="template-target-trigger" @click="openTemplateTargetPicker">
          <view class="nut-cell__title">{{ t("myPage.templates.target") }}</view>
          <view class="nut-cell__value">
            <nut-input
              :model-value="templateTargetLabel"
              :border="false"
              readonly
              input-align="right"
              right-icon="rect-right"
              @click-right-icon.stop="openTemplateTargetPicker"
            />
          </view>
        </nut-cell>
        <div class="template-content-editor">
          <CmView v-if="templateImportVisible" :is-read-only="false" id="TemplateEditor" />
        </div>
        <nut-button block type="primary" :loading="templateImporting" @click="saveTemplate">
          {{ t("myPage.templates.save") }}
        </nut-button>
      </div>
    </nut-popup>
    <DesktopPicker
      v-model="selectedTemplateTargetValue"
      v-model:visible="templateTargetPickerVisible"
      :columns="templateTargetColumns"
      :title="t('myPage.templates.targetPickerTitle')"
      :cancel-text="t('myPage.btn.cancel')"
      :ok-text="t('specificWord.confirm')"
      @confirm="handleTemplateTargetConfirm"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, onMounted, reactive, ref } from "vue";
import { Dialog } from "@nutui/nutui";
import { useI18n } from "vue-i18n";

import { useCloudflareApi } from "@/api/app";
import LanguageSwitcherButton from "@/components/LanguageSwitcherButton.vue";
import DesktopPicker from "@/components/DesktopPicker.vue";
import { useSettingsApi } from "@/api/settings";
import { useBackend } from "@/hooks/useBackend";
import { useAppNotifyStore } from "@/store/appNotify";
import { useCodeStore } from "@/store/codeStore";
import { useSettingsStore } from "@/store/settings";
import { TEMPLATE_TARGET_OPTIONS, getTargetLabel } from "@/constants/subscriptionTargets";
import { isMobile } from "@/utils/isMobile";

const CmView = defineAsyncComponent(() => import("@/views/editCode/cmView.vue"));

const settingsStore = useSettingsStore();
const settingsApi = useSettingsApi();
const cloudflareApi = useCloudflareApi();
const cmStore = useCodeStore();
const { showNotify } = useAppNotifyStore();
const { t } = useI18n();
const { icon, env } = useBackend();
const TEMPLATE_EDITOR_ID = "TemplateEditor";

const fileInput = ref<HTMLInputElement | null>(null);
const templateFileInput = ref<HTMLInputElement | null>(null);
const restoreIsLoading = ref(false);
const exportIsLoading = ref(false);
const requestEditing = ref(false);
const requestSaving = ref(false);
const templateImporting = ref(false);
const templateImportVisible = ref(false);
const templateEditingId = ref("");
const templateTargetPickerVisible = ref(false);
const templates = ref<any[]>([]);
const loadingTemplates = ref(true);

const requestForm = reactive({
  defaultUserAgent: "",
  defaultFlowUserAgent: "",
  defaultTimeout: "",
  backendRequestConcurrency: "",
  backendRequestConcurrencyWaitTime: "",
  remoteCacheTtl: "",
  remoteCacheStaleOnError: true,
  nodeInfoApiUrl: "",
});
const templateForm = reactive({
  id: "",
  name: "",
  target: "mihomo",
});
const selectedTemplateTargetValue = ref<string[]>([]);
const templateTargetColumns = computed(() => {
  return TEMPLATE_TARGET_OPTIONS.map((option) => ({
    text: option.label,
    value: option.value,
  }));
});
const templateTargetLabel = computed(() => {
  return getTargetLabel(templateForm.target);
});
const appName = computed(() => {
  return env.value?.app
    || env.value?.meta?.cloudflare?.env?.SUB_STORE_BACKEND_CUSTOM_NAME
    || "Sub-Store Cloudflare";
});
const requestSummary = computed(() => {
  return t("myPage.request.summary", {
    concurrency: settingsStore.backendRequestConcurrency || "3",
    timeout: settingsStore.defaultTimeout || "30000",
  });
});

const syncRequestForm = () => {
  requestForm.defaultUserAgent = settingsStore.defaultUserAgent || "";
  requestForm.defaultFlowUserAgent = settingsStore.defaultFlowUserAgent || "";
  requestForm.defaultTimeout = settingsStore.defaultTimeout || "";
  requestForm.backendRequestConcurrency = settingsStore.backendRequestConcurrency || "";
  requestForm.backendRequestConcurrencyWaitTime = settingsStore.backendRequestConcurrencyWaitTime || "";
  requestForm.remoteCacheTtl = settingsStore.remoteCacheTtl || "300";
  requestForm.remoteCacheStaleOnError = settingsStore.remoteCacheStaleOnError !== false;
  requestForm.nodeInfoApiUrl = settingsStore.nodeInfoApiUrl || "https://ipwho.is/{ip}";
};

const startRequestEdit = () => {
  syncRequestForm();
  requestEditing.value = true;
};

const cancelRequestEdit = () => {
  syncRequestForm();
  requestEditing.value = false;
};

const saveRequestSettings = async () => {
  requestSaving.value = true;
  try {
    const saved = await settingsStore.changeSettings({ ...requestForm });
    requestEditing.value = !saved;
  } finally {
    requestSaving.value = false;
  }
};

const selectBackupFile = () => {
  fileInput.value?.click();
};

const exportBackup = async () => {
  exportIsLoading.value = true;
  try {
    const response = await settingsApi.downloadBackup();
    const objectUrl = URL.createObjectURL(response.data);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `sub-store-cloudflare-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  } catch (error) {
    showNotify({ type: "danger", title: t("myPage.notify.backup.failedWithError", { e: errorMessage(error) }) });
  } finally {
    exportIsLoading.value = false;
  }
};

const fetchTemplates = async () => {
  loadingTemplates.value = true;
  try {
    const res = await cloudflareApi.getTemplates();
    if (res?.data?.status === "success" && Array.isArray(res.data.data)) {
      templates.value = res.data.data;
    }
  } catch {
    templates.value = [];
  } finally {
    loadingTemplates.value = false;
  }
};

const selectTemplateFile = () => {
  templateFileInput.value?.click();
};

const openTemplateImport = () => {
  templateEditingId.value = "";
  templateForm.id = "";
  templateForm.name = "";
  templateForm.target = "mihomo";
  cmStore.setEditCode(TEMPLATE_EDITOR_ID, "");
  templateImportVisible.value = true;
};

const openTemplateEdit = (template: any) => {
  templateEditingId.value = template.name;
  templateForm.id = template.name;
  templateForm.name = template.displayName || template.name;
  templateForm.target = template.target || "mihomo";
  cmStore.setEditCode(TEMPLATE_EDITOR_ID, JSON.stringify(template.config || {}, null, 2));
  templateImportVisible.value = true;
};

const importTemplateFromFile = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  target.value = "";
  if (!file) return;

  templateEditingId.value = "";
  templateForm.id = file.name.replace(/\.(json|ya?ml)$/i, "").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  templateForm.name = file.name.replace(/\.(json|ya?ml)$/i, "");
  templateForm.target = "mihomo";
  cmStore.setEditCode(TEMPLATE_EDITOR_ID, await file.text());
  templateImportVisible.value = true;
};

const openTemplateTargetPicker = () => {
  selectedTemplateTargetValue.value = [templateForm.target || "mihomo"];
  templateTargetPickerVisible.value = true;
};

const handleTemplateTargetConfirm = ({ selectedValue }) => {
  templateForm.target = selectedValue?.[0] || "mihomo";
  selectedTemplateTargetValue.value = [templateForm.target];
  templateTargetPickerVisible.value = false;
};

const saveTemplate = async () => {
  const content = String(cmStore.EditCode[TEMPLATE_EDITOR_ID] || "");
  if (!templateForm.id || !content.trim()) {
    showNotify({ type: "danger", title: t("myPage.templates.validationRequired") });
    return;
  }

  templateImporting.value = true;
  try {
    const payload = {
      id: templateForm.id,
      name: templateForm.name || templateForm.id,
      target: templateForm.target,
      content,
    };
    const res = templateEditingId.value
      ? await cloudflareApi.updateTemplate(templateEditingId.value, payload)
      : await cloudflareApi.createTemplate(payload);
    if (res?.data?.status !== "success") throw new Error("import failed");
    await fetchTemplates();
    templateImportVisible.value = false;
    templateEditingId.value = "";
    showNotify({ type: "success", title: t("myPage.templates.saveSucceed") });
  } catch (error) {
    showNotify({ type: "danger", title: t("myPage.templates.saveFailed", { e: errorMessage(error) }) });
  } finally {
    templateImporting.value = false;
  }
};

const deleteCustomTemplate = (name: string) => {
  Dialog({
    title: t("myPage.templates.deleteTitle"),
    content: t("myPage.templates.deleteContent", { name }),
    popClass: "auto-dialog",
    okText: t("myPage.btn.delete"),
    cancelText: t("myPage.btn.cancel"),
    closeOnClickOverlay: true,
    onOk: async () => {
      const res = await cloudflareApi.deleteTemplate(name);
      if (res?.data?.status === "success") {
        await fetchTemplates();
        showNotify({ type: "success", title: t("myPage.templates.deleteSucceed") });
      }
    },
  });
};

const restoreFromFile = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  target.value = "";
  if (!file) return;

  Dialog({
    title: t("myPage.backup.restoreTitle"),
    content: t("myPage.backup.restoreContent"),
    popClass: "auto-dialog",
    okText: t("myPage.backup.restore"),
    cancelText: t("myPage.btn.cancel"),
    closeOnClickOverlay: true,
    onOk: async () => {
      restoreIsLoading.value = true;
      try {
        const content = await file.text();
        const res = await settingsApi.restoreSettings({ content });
        if (res?.data?.status !== "success") throw new Error("restore failed");
        await settingsStore.fetchSettings();
        showNotify({ type: "success", title: t("myPage.notify.restore.succeed") });
      } catch (error) {
        showNotify({ type: "danger", title: t("myPage.notify.restore.failedWithError", { e: errorMessage(error) }) });
      } finally {
        restoreIsLoading.value = false;
      }
    },
  });
};

const errorMessage = (error: unknown) => error instanceof Error ? error.message : String(error);

onMounted(fetchTemplates);
</script>

<style lang="scss" scoped>
.my-page-wrapper {
  min-height: 100%;
  padding: var(--safe-area-side);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.profile-block {
  width: 100%;

  .radio-wrapper {
    display: flex;
    align-items: center;

    .tag {
      margin: 0 5px;
      padding: 7.5px 2.5px 4px;
      flex-shrink: 0;
      color: var(--second-text-color);
      font-size: 12px;
      cursor: pointer;
      user-select: none;
    }

    .current {
      border-bottom: 1px solid var(--primary-color);
      color: var(--primary-color);
    }

    .storage-language-switch {
      margin-left: auto;
      flex-shrink: 0;
    }
  }

  .info {
    width: 100%;
    margin-bottom: 10px;
    padding: 12px 0 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .avatar-wrapper {
    min-width: 0;
    max-width: 64%;
    display: flex;
    align-items: center;

    :deep(.nut-avatar) {
      background: var(--card-color);
    }
  }

  .name {
    min-width: 0;
    margin-left: 12px;
    display: flex;
    flex-direction: column;
    font-size: 18px;
    font-weight: bold;
  }

  .title {
    margin: 0;
    overflow: hidden;
    color: var(--primary-text-color);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .des {
    margin-top: 6px;
    display: flex;
    flex-direction: column;
    color: var(--comment-text-color);
    font-size: 12px;
    font-weight: normal;
    line-height: 1.45;
  }

  .actions {
    margin-left: 12px;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;

    input {
      display: none;
    }

    svg {
      margin-right: 4px;
    }

    .nut-button {
      width: 116px;
      padding: 0 10px;
    }

    .nut-button--plain {
      background: transparent;
    }

    a {
      margin-top: 12px;
    }
  }
}

.config-card {
  width: 100%;
  border-radius: var(--item-card-radios, 14px);
  background: var(--card-color);
  color: var(--second-text-color);
  border: 1px solid var(--divider-color);
  box-shadow: 0 2px 12px -2px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  transition: box-shadow 0.25s ease, border-color 0.25s ease;

  &:hover {
    box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.08);
    border-color: color-mix(in srgb, var(--primary-color) 25%, transparent);
  }
}

.nut-icon {
  color: var(--lowest-text-color);
}

.right-icon {
  color: var(--comment-text-color);
}

/* Feature Cards for Templates */
.template-card-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
}

.template-card {
  min-height: 54px;
  padding: var(--space-3);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  border-radius: var(--radius-lg);
  background: var(--card-color);
  border: 1px solid var(--divider-color);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease, border-color 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: color-mix(in srgb, var(--primary-color) 30%, transparent);
    box-shadow: 0 6px 18px -2px rgba(0, 0, 0, 0.08);
  }

  .template-icon-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: var(--radius-md);
    font-size: 14px;
    flex-shrink: 0;
    color: var(--primary-color);
    background: color-mix(in srgb, var(--primary-color) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--primary-color) 20%, transparent);
  }

  .template-info {
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .template-header-line {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .template-title {
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--primary-text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .template-target-pill {
    font-size: var(--text-xs);
    color: var(--comment-text-color);
  }

  .template-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
}

/* Skeleton Loaders */
.skeleton-card {
  min-height: 56px;
  padding: var(--space-3);
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.skeleton-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--divider-color) 60%, transparent);
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.skeleton-line {
  height: 12px;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--divider-color) 50%, transparent);

  &.title {
    width: 50%;
    height: 14px;
  }

  &.sub {
    width: 35%;
  }
}

.template-import-panel {
  height: 100%;
  padding: 18px 16px calc(18px + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: var(--second-text-color);

  h2 {
    margin: 0 0 4px;
    font-size: 17px;
    color: var(--primary-text-color);
  }
}

.template-target-trigger {
  box-shadow: none;
  border-radius: var(--item-card-radios);
  background: var(--background-color);
}

.template-content-editor {
  flex: 1;
  min-height: 220px;
  border: 1px solid var(--divider-color);
  border-radius: var(--item-card-radios);
  background: var(--background-color);
  overflow: auto;

  :deep(.cmviewRef) {
    min-height: 220px;
  }

  :deep(.cm-editor) {
    min-height: 220px;
  }
}

.title-wrapper {
  min-height: 48px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--divider-color);
  cursor: pointer;

  h1 {
    margin: 0;
    font-size: 15px;
    color: var(--primary-text-color);
  }
}

.storage-card .title-wrapper {
  cursor: default;
}

.storage-actions,
.config-btn-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;

  input {
    display: none;
  }
}

.card-desc {
  margin: 0;
  padding: 12px 16px 16px;
  color: var(--comment-text-color);
  font-size: 12px;
  line-height: 1.6;
}

/* Settings Form Grid & Standardized Controls (40px/44px) */
.settings-form-grid {
  padding: var(--space-4);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.form-field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &--full {
    grid-column: 1 / -1;
  }
}

.form-field-label {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--second-text-color);
}

.settings-input {
  box-sizing: border-box;
  width: 100%;
  height: 40px;
  min-height: 40px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--divider-color);
  background: var(--background-color);
  color: var(--primary-text-color);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px var(--focus-ring-color);
    outline: none;
  }
}

.toggle-card-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--background-color);
  border: 1px solid var(--divider-color);

  .toggle-card-title {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--primary-text-color);
  }
}

@media screen and (max-width: 430px) {
  .profile-block {
    .info {
      align-items: flex-start;
    }

    .avatar-wrapper {
      max-width: calc(100% - 132px);
    }

    .actions {
      .nut-button {
        width: 104px;
        padding: 0 8px;
      }
    }
  }

  .title-wrapper {
    align-items: flex-start;
    flex-direction: column;
    padding: 14px 16px;
  }

  .storage-actions {
    flex-wrap: wrap;
  }

  .template-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .template-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
