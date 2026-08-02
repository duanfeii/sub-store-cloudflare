<template>
  <div class="tools-page">
    <section class="tool-card">
      <h2>{{ t('toolsPage.converter.title') }}</h2>
      <p>{{ t('toolsPage.converter.desc') }}</p>
      <div class="row">
        <select v-model="conversionKind">
          <option value="proxy">{{ t('toolsPage.converter.proxy') }}</option>
          <option value="rule">{{ t('toolsPage.converter.rule') }}</option>
        </select>
        <select v-model="conversionTarget">
          <option v-for="target in conversionTargets" :key="target" :value="target">{{ target }}</option>
        </select>
      </div>
      <textarea v-model="conversionInput" :placeholder="t('toolsPage.converter.input')" />
      <div class="actions">
        <nut-button type="primary" :loading="converting" @click="runConversion">{{ t('toolsPage.converter.run') }}</nut-button>
        <nut-button plain type="primary" :disabled="!conversionOutput" @click="copyText(conversionOutput)">{{ t('toolsPage.converter.copy') }}</nut-button>
      </div>
      <textarea v-model="conversionOutput" readonly :placeholder="t('toolsPage.converter.output')" />
      <p v-if="conversionStats" class="stats">{{ conversionStats }}</p>
    </section>

    <section class="tool-card">
      <h2>{{ t('toolsPage.shares.title') }}</h2>
      <p>{{ t('toolsPage.shares.desc') }}</p>
      <div class="row share-form">
        <select v-model="shareForm.resourceType">
          <option value="source">source</option>
          <option value="collection">collection</option>
        </select>
        <input v-model.trim="shareForm.resourceId" :placeholder="t('toolsPage.shares.resourceId')" />
        <select v-model="shareForm.target">
          <option value="">auto</option>
          <option v-for="target in proxyTargets" :key="target" :value="target">{{ target }}</option>
        </select>
        <input v-model="shareForm.expiresHours" type="number" min="0" max="8760" :placeholder="t('toolsPage.shares.expires')" />
      </div>
      <nut-button type="primary" :loading="shareCreating" @click="createShare">{{ t('toolsPage.shares.create') }}</nut-button>
      <div v-if="createdShareUrl" class="created-link" @click="copyText(createdShareUrl)">{{ createdShareUrl }}</div>
      <p v-if="shares.length === 0" class="empty">{{ t('toolsPage.shares.empty') }}</p>
      <div v-for="share in shares" :key="share.id" class="list-item">
        <div>
          <strong>{{ share.resourceType }}/{{ share.resourceId }}</strong>
          <small>{{ share.target || 'auto' }} · {{ share.expiresAt ? new Date(share.expiresAt).toLocaleString() : 'never' }}</small>
        </div>
        <div class="actions">
          <nut-button plain size="mini" @click="toggleShare(share)">{{ share.enabled ? t('toolsPage.shares.disable') : t('toolsPage.shares.enable') }}</nut-button>
          <nut-button plain type="danger" size="mini" @click="removeShare(share.id)">{{ t('myPage.btn.delete') }}</nut-button>
        </div>
      </div>
    </section>

    <section class="tool-card">
      <h2>{{ t('toolsPage.recycle.title') }}</h2>
      <p>{{ t('toolsPage.recycle.desc') }}</p>
      <p v-if="recycleEntries.length === 0" class="empty">{{ t('toolsPage.recycle.empty') }}</p>
      <div v-for="entry in recycleEntries" :key="entry.id" class="list-item">
        <div>
          <strong>{{ entry.resourceType }}/{{ entry.resourceId }}</strong>
          <small>{{ new Date(entry.deletedAt).toLocaleString() }}</small>
        </div>
        <div class="actions">
          <nut-button plain type="primary" size="mini" @click="restoreEntry(entry.id)">{{ t('toolsPage.recycle.restore') }}</nut-button>
          <nut-button plain type="danger" size="mini" @click="purgeEntry(entry.id)">{{ t('toolsPage.recycle.purge') }}</nut-button>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCloudflareApi } from '@/api/app';
import { useAppNotifyStore } from '@/store/appNotify';

const { t } = useI18n();
const api = useCloudflareApi();
const { showNotify } = useAppNotifyStore();
const proxyTargets = ['mihomo', 'stash', 'surge', 'surge-mac', 'surfboard', 'loon', 'egern', 'shadowrocket', 'qx', 'sing-box', 'v2ray', 'uri', 'json'];
const ruleTargets = ['mihomo', 'surge', 'loon', 'qx'];
const conversionKind = ref<'proxy' | 'rule'>('proxy');
const conversionTarget = ref('mihomo');
const conversionInput = ref('');
const conversionOutput = ref('');
const conversionStats = ref('');
const converting = ref(false);
const shares = ref<any[]>([]);
const recycleEntries = ref<any[]>([]);
const shareCreating = ref(false);
const createdShareUrl = ref('');
const shareForm = reactive({ resourceType: 'source', resourceId: '', target: '', expiresHours: '0' });
const conversionTargets = computed(() => conversionKind.value === 'proxy' ? proxyTargets : ruleTargets);

const runConversion = async () => {
  converting.value = true;
  try {
    if (!conversionTargets.value.includes(conversionTarget.value)) conversionTarget.value = conversionTargets.value[0];
    const response = conversionKind.value === 'proxy'
      ? await api.convertProxies({ content: conversionInput.value, target: conversionTarget.value })
      : await api.convertRules({ content: conversionInput.value, target: conversionTarget.value });
    const data = (response?.data as any)?.data;
    conversionOutput.value = String(data?.content || data?.par_res || '');
    conversionStats.value = `parsed ${data?.parsed || 0} · emitted ${data?.emitted || 0} · skipped ${data?.skipped || 0}`;
    showNotify({ type: 'success', title: t('toolsPage.notify.converted') });
  } catch (error) {
    notifyError(error);
  } finally {
    converting.value = false;
  }
};

const loadShares = async () => {
  const response = await api.getShares();
  const data = (response?.data as any)?.data;
  shares.value = Array.isArray(data) ? data : [];
};
const loadRecycle = async () => {
  const response = await api.getRecycleBin();
  const data = (response?.data as any)?.data;
  recycleEntries.value = Array.isArray(data) ? data : [];
};
const createShare = async () => {
  shareCreating.value = true;
  try {
    const response = await api.createShare({
      resourceType: shareForm.resourceType,
      resourceId: shareForm.resourceId,
      target: shareForm.target || undefined,
      expiresIn: Math.max(0, Number(shareForm.expiresHours) || 0) * 3600,
    });
    createdShareUrl.value = String((response?.data as any)?.data?.url || '');
    await loadShares();
    showNotify({ type: 'success', title: t('toolsPage.notify.shareCreated') });
  } catch (error) {
    notifyError(error);
  } finally {
    shareCreating.value = false;
  }
};
const toggleShare = async (share: any) => { await api.updateShare(share.id, { enabled: !share.enabled }); await loadShares(); };
const removeShare = async (id: string) => { await api.deleteShare(id); await Promise.all([loadShares(), loadRecycle()]); };
const restoreEntry = async (id: string) => { await api.restoreRecycleEntry(id); await loadRecycle(); };
const purgeEntry = async (id: string) => { await api.deleteRecycleEntry(id); await loadRecycle(); };
const copyText = async (value: string) => { await navigator.clipboard.writeText(value); showNotify({ type: 'success', title: t('toolsPage.notify.copied') }); };
const notifyError = (error: unknown) => showNotify({ type: 'danger', title: t('toolsPage.notify.failed', { e: error instanceof Error ? error.message : String(error) }) });

onMounted(() => Promise.all([loadShares(), loadRecycle()]));
</script>

<style lang="scss" scoped>
.tools-page {
  min-height: 100%;
  padding: var(--safe-area-side);
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  @media screen and (min-width: 900px) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;

    .tool-card:first-child {
      grid-column: 1 / -1;
    }
  }
}

.tool-card {
  padding: 20px;
  border-radius: var(--item-card-radios, 14px);
  background: var(--card-color);
  color: var(--second-text-color);
  border: 1px solid var(--divider-color);
  box-shadow: 0 2px 12px -2px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s ease;

  &:hover {
    box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.08);
    border-color: rgba(99, 102, 241, 0.25);
  }
}

h2 {
  margin: 0 0 6px 0;
  color: var(--primary-text-color);
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

p {
  color: var(--comment-text-color);
  font-size: 13px;
  line-height: 1.6;
  margin-top: 0;
  margin-bottom: 12px;
}

.row {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

select, input, textarea {
  box-sizing: border-box;
  border: 1px solid var(--divider-color);
  border-radius: 10px;
  background: var(--background-color);
  color: var(--primary-text-color);
  font-size: 13px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    outline: none;
  }
}

select, input {
  min-height: 40px;
  padding: 0 12px;
}

textarea {
  width: 100%;
  min-height: 140px;
  padding: 12px;
  resize: vertical;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  line-height: 1.5;
}

.actions {
  display: flex;
  gap: 10px;
  margin: 12px 0;
}

.share-form {
  flex-wrap: wrap;

  input {
    flex: 1;
    min-width: 150px;
  }
}

.created-link {
  margin: 12px 0;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--background-color);
  border: 1px dashed var(--divider-color);
  overflow-wrap: anywhere;
  cursor: copy;
  font-size: 13px;
  color: var(--primary-color);
  font-family: monospace;
  transition: background-color 0.2s ease;

  &:hover {
    background: rgba(99, 102, 241, 0.08);
  }
}

.list-item {
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-top: 1px solid var(--divider-color);

  div:first-child {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  strong {
    color: var(--primary-text-color);
    font-size: 14px;
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  small {
    color: var(--comment-text-color);
    font-size: 12px;
  }
}

.stats, .empty {
  color: var(--comment-text-color);
  font-size: 13px;
  margin-top: 8px;
}

@media (max-width: 520px) {
  .row {
    flex-direction: column;
  }
  .list-item {
    align-items: flex-start;
    flex-direction: column;
    padding: 12px 0;
  }
}
</style>
