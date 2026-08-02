<template>
  <div class="tools-page">
    <!-- Converter Tool Card -->
    <section class="tool-card">
      <h2 class="card-title-with-icon">
        <span class="tool-icon-wrapper converter">
          <font-awesome-icon icon="fa-solid fa-arrows-rotate" />
        </span>
        {{ t('toolsPage.converter.title') }}
      </h2>
      <p>{{ t('toolsPage.converter.desc') }}</p>

      <div class="form-section-card">
        <div class="row">
          <div class="form-field">
            <select v-model="conversionKind" class="field-control">
              <option value="proxy">{{ t('toolsPage.converter.proxy') }}</option>
              <option value="rule">{{ t('toolsPage.converter.rule') }}</option>
            </select>
          </div>
          <div class="form-field">
            <select v-model="conversionTarget" class="field-control">
              <option v-for="target in conversionTargets" :key="target" :value="target">{{ target }}</option>
            </select>
          </div>
        </div>

        <textarea
          v-model="conversionInput"
          class="field-control field-control--mono"
          :placeholder="t('toolsPage.converter.input')"
        />

        <div class="actions">
          <nut-button type="primary" :loading="converting" @click="runConversion">
            <font-awesome-icon icon="fa-solid fa-play" class="btn-icon" />
            {{ t('toolsPage.converter.run') }}
          </nut-button>
          <nut-button plain type="primary" :disabled="!conversionOutput" @click="copyText(conversionOutput)">
            <font-awesome-icon icon="fa-solid fa-clone" class="btn-icon" />
            {{ t('toolsPage.converter.copy') }}
          </nut-button>
        </div>

        <textarea
          v-model="conversionOutput"
          class="field-control field-control--mono"
          readonly
          :placeholder="t('toolsPage.converter.output')"
        />
        <p v-if="conversionStats" class="stats">{{ conversionStats }}</p>
      </div>
    </section>

    <!-- Shares Tool Card -->
    <section class="tool-card">
      <h2 class="card-title-with-icon">
        <span class="tool-icon-wrapper shares">
          <font-awesome-icon icon="fa-solid fa-share-nodes" />
        </span>
        {{ t('toolsPage.shares.title') }}
      </h2>
      <p>{{ t('toolsPage.shares.desc') }}</p>

      <div class="form-section-card">
        <div class="row share-form">
          <div class="form-field">
            <select v-model="shareForm.resourceType" class="field-control">
              <option value="source">{{ t('toolsPage.shares.source') }}</option>
              <option value="collection">{{ t('toolsPage.shares.collection') }}</option>
            </select>
          </div>
          <div class="form-field form-field--grow">
            <input
              v-model.trim="shareForm.resourceId"
              class="field-control"
              :placeholder="t('toolsPage.shares.resourceId')"
            />
          </div>
          <div class="form-field">
            <select v-model="shareForm.target" class="field-control">
              <option value="">{{ t('toolsPage.shares.auto') }}</option>
              <option v-for="target in proxyTargets" :key="target" :value="target">{{ target }}</option>
            </select>
          </div>
          <div class="form-field">
            <input
              v-model="shareForm.expiresHours"
              class="field-control"
              type="number"
              min="0"
              max="8760"
              :placeholder="t('toolsPage.shares.expires')"
            />
          </div>
        </div>

        <nut-button type="primary" :loading="shareCreating" @click="createShare">
          <font-awesome-icon icon="fa-solid fa-plus" class="btn-icon" />
          {{ t('toolsPage.shares.create') }}
        </nut-button>
      </div>

      <div v-if="createdShareUrl" class="created-link" @click="copyText(createdShareUrl)">
        <font-awesome-icon icon="fa-solid fa-link" class="btn-icon" />
        {{ createdShareUrl }}
      </div>

      <!-- Loading Skeleton for Shares -->
      <div v-if="loadingShares" class="feature-card-list">
        <div class="feature-card skeleton-card skeleton-pulse">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-content">
            <div class="skeleton-line title"></div>
            <div class="skeleton-line sub"></div>
          </div>
        </div>
        <div class="feature-card skeleton-card skeleton-pulse">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-content">
            <div class="skeleton-line title"></div>
            <div class="skeleton-line sub"></div>
          </div>
        </div>
      </div>

      <p v-else-if="shares.length === 0" class="empty">{{ t('toolsPage.shares.empty') }}</p>
      
      <!-- Shares Feature Cards -->
      <div v-else class="feature-card-list">
        <div v-for="share in shares" :key="share.id" class="feature-card">
          <div class="feature-card__badge-icon">
            <font-awesome-icon icon="fa-solid fa-link" />
          </div>
          <div class="feature-card__main">
            <strong class="feature-card__title">{{ resourceTypeLabel(share.resourceType) }}/{{ share.resourceId }}</strong>
            <div class="feature-card__meta">
              <span>{{ shareMeta(share) }}</span>
              <span
                class="status-pill"
                :class="share.enabled ? 'is-on' : 'is-off'"
              >{{ share.enabled ? t('toolsPage.shares.enabled') : t('toolsPage.shares.disabled') }}</span>
            </div>
          </div>
          <div class="feature-card__actions">
            <nut-button plain size="mini" @click="toggleShare(share)">
              {{ share.enabled ? t('toolsPage.shares.disable') : t('toolsPage.shares.enable') }}
            </nut-button>
            <nut-button plain type="danger" size="mini" @click="removeShare(share.id)">
              {{ t('myPage.btn.delete') }}
            </nut-button>
          </div>
        </div>
      </div>
    </section>

    <!-- Recycle Bin Tool Card -->
    <section class="tool-card">
      <h2 class="card-title-with-icon">
        <span class="tool-icon-wrapper recycle">
          <font-awesome-icon icon="fa-solid fa-trash-can" />
        </span>
        {{ t('toolsPage.recycle.title') }}
      </h2>
      <p>{{ t('toolsPage.recycle.desc') }}</p>

      <!-- Loading Skeleton for Recycle -->
      <div v-if="loadingRecycle" class="feature-card-list">
        <div class="feature-card skeleton-card skeleton-pulse">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-content">
            <div class="skeleton-line title"></div>
            <div class="skeleton-line sub"></div>
          </div>
        </div>
        <div class="feature-card skeleton-card skeleton-pulse">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-content">
            <div class="skeleton-line title"></div>
            <div class="skeleton-line sub"></div>
          </div>
        </div>
      </div>

      <p v-else-if="recycleEntries.length === 0" class="empty">{{ t('toolsPage.recycle.empty') }}</p>

      <!-- Recycle Feature Cards -->
      <div v-else class="feature-card-list">
        <div v-for="entry in recycleEntries" :key="entry.id" class="feature-card">
          <div class="feature-card__badge-icon recycle">
            <font-awesome-icon icon="fa-solid fa-trash-can" />
          </div>
          <div class="feature-card__main">
            <strong class="feature-card__title">{{ resourceTypeLabel(entry.resourceType) }}/{{ entry.resourceId }}</strong>
            <div class="feature-card__meta mono-time">{{ new Date(entry.deletedAt).toLocaleString() }}</div>
          </div>
          <div class="feature-card__actions">
            <nut-button plain type="primary" size="mini" @click="restoreEntry(entry.id)">
              {{ t('toolsPage.recycle.restore') }}
            </nut-button>
            <nut-button plain type="danger" size="mini" @click="purgeEntry(entry.id)">
              {{ t('toolsPage.recycle.purge') }}
            </nut-button>
          </div>
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
const loadingShares = ref(true);
const loadingRecycle = ref(true);
const shareCreating = ref(false);
const createdShareUrl = ref('');
const shareForm = reactive({ resourceType: 'source', resourceId: '', target: '', expiresHours: '0' });
const conversionTargets = computed(() => conversionKind.value === 'proxy' ? proxyTargets : ruleTargets);

const resourceTypeLabel = (type: string) => {
  if (type === 'collection') return t('toolsPage.shares.collection');
  if (type === 'source') return t('toolsPage.shares.source');
  return type;
};

const shareMeta = (share: { target?: string; expiresAt?: string | null }) => {
  const target = share.target || t('toolsPage.shares.auto');
  const expires = share.expiresAt
    ? new Date(share.expiresAt).toLocaleString()
    : t('toolsPage.shares.never');
  return t('toolsPage.shares.meta', { target, expires });
};

const runConversion = async () => {
  converting.value = true;
  try {
    if (!conversionTargets.value.includes(conversionTarget.value)) conversionTarget.value = conversionTargets.value[0];
    const response = conversionKind.value === 'proxy'
      ? await api.convertProxies({ content: conversionInput.value, target: conversionTarget.value })
      : await api.convertRules({ content: conversionInput.value, target: conversionTarget.value });
    const data = (response?.data as any)?.data;
    conversionOutput.value = String(data?.content || data?.par_res || '');
    conversionStats.value = t('toolsPage.converter.stats', {
      parsed: data?.parsed || 0,
      emitted: data?.emitted || 0,
      skipped: data?.skipped || 0,
    });
    showNotify({ type: 'success', title: t('toolsPage.notify.converted') });
  } catch (error) {
    notifyError(error);
  } finally {
    converting.value = false;
  }
};

const loadShares = async () => {
  loadingShares.value = true;
  try {
    const response = await api.getShares();
    const data = (response?.data as any)?.data;
    shares.value = Array.isArray(data) ? data : [];
  } catch (error) {
    shares.value = [];
  } finally {
    loadingShares.value = false;
  }
};

const loadRecycle = async () => {
  loadingRecycle.value = true;
  try {
    const response = await api.getRecycleBin();
    const data = (response?.data as any)?.data;
    recycleEntries.value = Array.isArray(data) ? data : [];
  } catch (error) {
    recycleEntries.value = [];
  } finally {
    loadingRecycle.value = false;
  }
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
  gap: var(--space-4);
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
  padding: var(--space-5);
  border-radius: var(--item-card-radios, 12px);
  background: var(--card-color);
  color: var(--second-text-color);
  border: 1px solid var(--divider-color);
  box-shadow: 0 2px 12px -2px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s ease;

  &:hover {
    box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.08);
    border-color: color-mix(in srgb, var(--primary-color) 25%, transparent);
  }
}

h2 {
  margin: 0 0 var(--space-2) 0;
  color: var(--primary-text-color);
  font-size: var(--text-md);
  font-weight: 600;
  letter-spacing: -0.01em;
}

p {
  color: var(--comment-text-color);
  font-size: var(--text-sm);
  line-height: 1.6;
  margin-top: 0;
  margin-bottom: var(--space-3);
}

.card-title-with-icon {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);

  .tool-icon-wrapper {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: var(--radius-md);
    font-size: var(--text-md);
    flex-shrink: 0;
    color: var(--primary-color);
    background: color-mix(in srgb, var(--primary-color) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--primary-color) 22%, transparent);

    &.recycle {
      color: var(--danger-color);
      background: color-mix(in srgb, var(--danger-color) 12%, transparent);
      border-color: color-mix(in srgb, var(--danger-color) 22%, transparent);
    }
  }
}

.form-section-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--background-color) 50%, var(--card-color));
  border: 1px solid var(--divider-color);
}

.row {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.form-field {
  flex: 1;
  min-width: 130px;

  &--grow {
    flex: 2;
    min-width: 180px;
  }
}

// Standardized Control Heights (40px/44px) & Focus Ring
.field-control {
  box-sizing: border-box;
  width: 100%;
  height: 40px;
  min-height: 40px;
  border: 1px solid var(--divider-color);
  border-radius: var(--radius-md);
  background: var(--card-color);
  color: var(--primary-text-color);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  padding: 0 var(--space-3);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px var(--focus-ring-color);
    outline: none;
  }

  &--mono,
  &:is(textarea) {
    height: auto;
    min-height: 140px;
    padding: var(--space-3);
    resize: vertical;
    font-family: var(--font-mono);
    line-height: 1.5;
  }
}

select.field-control {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748B'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 14px;
  padding-right: 28px;
}

.btn-icon {
  margin-right: var(--space-1);
}

.actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-1);
}

.created-link {
  margin-bottom: var(--space-3);
  padding: var(--space-3) 14px;
  border-radius: var(--radius-md);
  background: var(--background-color);
  border: 1px dashed var(--divider-color);
  overflow-wrap: anywhere;
  cursor: copy;
  font-size: var(--text-sm);
  color: var(--primary-color);
  font-family: var(--font-mono);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  transition: background-color 0.2s ease, border-color 0.2s ease;

  &:hover {
    background: color-mix(in srgb, var(--primary-color) 8%, transparent);
    border-color: var(--primary-color);
  }
}

/* Feature Cards & Micro-interactions */
.feature-card-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.feature-card {
  min-height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  background: var(--card-color);
  border: 1px solid var(--divider-color);
  transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 200ms ease, border-color 200ms ease;

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      transform: translateY(-2px);
      border-color: color-mix(in srgb, var(--primary-color) 30%, transparent);
      box-shadow: 0 6px 18px -2px rgba(0, 0, 0, 0.08);
    }
  }

  &:active {
    transform: scale(0.97);
  }

  &__badge-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: var(--radius-md);
    font-size: 14px;
    flex-shrink: 0;
    color: var(--primary-color);
    background: color-mix(in srgb, var(--primary-color) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--primary-color) 20%, transparent);

    &.recycle {
      color: var(--danger-color);
      background: color-mix(in srgb, var(--danger-color) 12%, transparent);
      border-color: color-mix(in srgb, var(--danger-color) 20%, transparent);
    }
  }

  &__main {
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &__title {
    color: var(--primary-text-color);
    font-size: var(--text-base);
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    color: var(--comment-text-color);
    font-size: var(--text-xs);
  }

  &__actions {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: var(--space-2);
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
  width: 34px;
  height: 34px;
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
    width: 60%;
    height: 14px;
  }

  &.sub {
    width: 40%;
  }
}

.mono-time {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 1px var(--space-2);
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 500;
  line-height: 1.4;

  &.is-on {
    color: var(--succeed-color);
    background: color-mix(in srgb, var(--succeed-color) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--succeed-color) 22%, transparent);
  }

  &.is-off {
    color: var(--comment-text-color);
    background: color-mix(in srgb, var(--comment-text-color) 10%, transparent);
    border: 1px solid var(--divider-color);
  }
}

.stats, .empty {
  color: var(--comment-text-color);
  font-size: var(--text-sm);
  margin-top: var(--space-2);
}

.stats {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
}

@media (max-width: 520px) {
  .row {
    flex-direction: column;
  }
  .feature-card {
    align-items: flex-start;
    flex-direction: column;

    &__actions {
      width: 100%;
      justify-content: flex-start;
      margin-top: var(--space-1);
    }
  }
}
</style>
