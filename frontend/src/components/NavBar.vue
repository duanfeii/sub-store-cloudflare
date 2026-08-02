<template>
  <div class="nav-bar-wrapper">
    <nav
      class="nav-bar"
      :class="{
        'is-desktop': isDesktop,
        'is-search-expanded': isMobileSearchExpanded,
      }"
    >
      <div class="nav-bar__left">
        <button
          v-if="isNeedBack"
          type="button"
          class="nav-btn nav-btn--leading"
          :aria-label="t('navBar.actions.back')"
          :title="t('navBar.actions.back')"
          @click.stop="back"
        >
          <font-awesome-icon
            class="nav-btn__icon"
            icon="fa-solid fa-arrow-left"
          />
        </button>
        <div
          v-else-if="!isMobileSearchExpanded"
          class="app-brand"
          role="link"
          tabindex="0"
          :aria-label="t('navBar.brand.home')"
          @click.stop="router.push('/')"
          @keydown.enter.stop.prevent="router.push('/')"
        >
          <img
            class="app-brand__logo"
            :src="brandLogo"
            alt=""
            width="22"
            height="22"
          />
          <span class="app-brand__name">Sub Store</span>
          <span class="app-brand__badge">{{ envBadge }}</span>
        </div>
      </div>

      <div class="nav-bar__center">
        <div
          v-if="showDesktopSearch || isMobileSearchExpanded"
          class="nav-search-field"
          @click.stop
        >
          <font-awesome-icon
            class="nav-search-field__icon"
            icon="fa-solid fa-magnifying-glass"
          />
          <input
            ref="searchInputRef"
            v-model="listSearchQuery"
            class="nav-search-input"
            type="search"
            :placeholder="t('navBar.listSearch.placeholder')"
            :aria-label="t('navBar.listSearch.placeholder')"
            @keydown.esc.stop.prevent="handleSearchEscape"
          />
          <button
            v-if="listSearchQuery || isMobileSearchExpanded"
            type="button"
            class="nav-search-clear"
            :aria-label="listSearchQuery ? t('navBar.listSearch.clear') : t('navBar.listSearch.close')"
            :title="listSearchQuery ? t('navBar.listSearch.clear') : t('navBar.listSearch.close')"
            @click.stop="handleSearchCloseButton"
          >
            <font-awesome-icon icon="fa-solid fa-circle-xmark" />
          </button>
        </div>
        <h1
          v-else-if="currentTitle"
          class="nav-title"
          :title="currentTitle"
        >
          {{ currentTitle }}
        </h1>
      </div>

      <div class="nav-bar__right">
        <template v-if="isDesktop">
          <button
            v-if="showRefreshButton"
            type="button"
            class="nav-btn"
            :aria-label="t('navBar.actions.refresh')"
            :title="t('navBar.actions.refresh')"
            @click.stop="refresh"
          >
            <font-awesome-icon
              class="nav-btn__icon"
              icon="fa-solid fa-arrow-rotate-right"
            />
          </button>
          <button
            v-if="showAddButton"
            type="button"
            class="nav-btn"
            :aria-label="t('navBar.actions.add')"
            :title="t('navBar.actions.add')"
            @click.stop="add(route)"
          >
            <font-awesome-icon
              class="nav-btn__icon"
              icon="fa-solid fa-plus"
            />
          </button>
        </template>
        <template v-else>
          <button
            v-if="showSearchButton && !isMobileSearchExpanded"
            type="button"
            class="nav-btn"
            :class="{ 'is-active': listSearchStore.hasQuery }"
            :aria-label="t('navBar.listSearch.open')"
            :title="t('navBar.listSearch.open')"
            @click.stop="openListSearch"
          >
            <font-awesome-icon
              class="nav-btn__icon"
              icon="fa-solid fa-magnifying-glass"
            />
          </button>
          <div
            v-if="showMobileOverflow"
            class="nav-overflow"
          >
            <button
              type="button"
              class="nav-btn"
              :class="{ 'is-active': isOverflowOpen }"
              :aria-label="t('navBar.actions.more')"
              :title="t('navBar.actions.more')"
              :aria-expanded="isOverflowOpen"
              @click.stop="toggleOverflow"
            >
              <font-awesome-icon
                class="nav-btn__icon"
                icon="fa-solid fa-ellipsis"
              />
            </button>
            <div
              v-if="isOverflowOpen"
              class="nav-overflow__menu"
              role="menu"
            >
              <button
                v-if="showRefreshButton"
                type="button"
                class="nav-overflow__item"
                role="menuitem"
                @click.stop="runOverflowAction(refresh)"
              >
                <font-awesome-icon icon="fa-solid fa-arrow-rotate-right" />
                <span>{{ t('navBar.actions.refresh') }}</span>
              </button>
              <button
                v-if="showAddButton"
                type="button"
                class="nav-overflow__item"
                role="menuitem"
                @click.stop="runOverflowAction(() => add(route))"
              >
                <font-awesome-icon icon="fa-solid fa-plus" />
                <span>{{ t('navBar.actions.add') }}</span>
              </button>
            </div>
          </div>
        </template>
      </div>
    </nav>
  </div>
</template>

<script lang="ts" setup>
import { useMediaQuery } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import brandLogo from "@/assets/icons/logo.png";
import i18n from "@/locales";
import { useAppNotifyStore } from "@/store/appNotify";
import { useListSearchStore } from "@/store/listSearch";
import { useMethodStore } from "@/store/methodStore";
import { useSettingsStore } from "@/store/settings";
import { SIDEBAR_BREAKPOINT, useSystemStore } from "@/store/system";
import { initStores } from "@/utils/initApp";

const { t: i18n_global } = i18n.global;
const envBadge = import.meta.env.DEV ? "dev" : "prod";
const { showNotify } = useAppNotifyStore();
const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const methodStore = useMethodStore();
const systemStore = useSystemStore();
const settingsStore = useSettingsStore();
const listSearchStore = useListSearchStore();
const { appearanceSetting } = storeToRefs(settingsStore);
const { navBarHeight, navBartop } = storeToRefs(systemStore);

const isDesktop = useMediaQuery(`(min-width: ${SIDEBAR_BREAKPOINT}px)`);
const searchInputRef = ref<HTMLInputElement | null>(null);
const isOverflowOpen = ref(false);
const isMobileSearchOpen = ref(false);

onMounted(() => {
  systemStore.initSystemState();
  window.addEventListener("keydown", handleGlobalKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleGlobalKeydown);
  document.removeEventListener("click", handleDocumentClick);
});

const isNeedBack = computed(() => {
  return route.meta.needNavBack ?? false;
});

const currentTitle = computed(() => {
  if (route.meta.title === "subEditor") {
    const isCollection = route.params.editType === "collections";
    const isCreate = route.params.id === "UNTITLED";
    const titleKey = isCollection
      ? (isCreate ? "collectionCreate" : "collectionEdit")
      : (isCreate ? "sourceCreate" : "sourceEdit");
    return t(`navBar.pagesTitle.${titleKey}`);
  }

  const metaTitle = route.meta.title;
  return metaTitle ? t(`navBar.pagesTitle.${metaTitle}`) : undefined;
});

const showRefreshButton = computed(() => {
  return !isNeedBack.value && !appearanceSetting.value.showFloatingRefreshButton;
});

const showAddButton = computed(() => {
  return ["/subs"].includes(route.path)
    && !appearanceSetting.value.showFloatingAddButton;
});

const showSearchButton = computed(() => {
  return Boolean(route.meta.supportsListSearch);
});

const showDesktopSearch = computed(() => {
  return isDesktop.value && showSearchButton.value;
});

const isMobileSearchExpanded = computed(() => {
  return !isDesktop.value
    && showSearchButton.value
    && isMobileSearchOpen.value;
});

const showMobileOverflow = computed(() => {
  return !isDesktop.value && (showRefreshButton.value || showAddButton.value);
});

const listSearchQuery = computed({
  get: () => listSearchStore.query,
  set: (value: string) => {
    listSearchStore.setQuery(value);
  },
});

watch(
  () => route.path,
  () => {
    listSearchStore.syncRoute(route.path, Boolean(route.meta.supportsListSearch));
    isMobileSearchOpen.value = false;
    isOverflowOpen.value = false;
  },
  { immediate: true },
);

watch(isDesktop, (desktop) => {
  if (desktop) {
    isMobileSearchOpen.value = false;
    isOverflowOpen.value = false;
    if (showSearchButton.value) {
      listSearchStore.open(route.path);
    }
  }
});

watch(
  showDesktopSearch,
  (visible) => {
    if (visible) {
      listSearchStore.open(route.path);
    }
  },
  { immediate: true },
);

const focusSearchInput = async () => {
  await nextTick();
  searchInputRef.value?.focus();
};

const openListSearch = async () => {
  listSearchStore.open(route.path);
  isMobileSearchOpen.value = true;
  isOverflowOpen.value = false;
  await focusSearchInput();
};

const closeMobileSearch = () => {
  isMobileSearchOpen.value = false;
  listSearchStore.close();
};

const handleSearchEscape = () => {
  if (listSearchQuery.value) {
    listSearchStore.setQuery("");
    return;
  }

  if (isMobileSearchExpanded.value) {
    closeMobileSearch();
  }
};

const handleSearchCloseButton = async () => {
  if (listSearchQuery.value) {
    listSearchStore.setQuery("");
    if (showDesktopSearch.value || isMobileSearchExpanded.value) {
      await focusSearchInput();
    }
    return;
  }

  if (isMobileSearchExpanded.value) {
    closeMobileSearch();
  }
};

const toggleOverflow = () => {
  isOverflowOpen.value = !isOverflowOpen.value;
};

const runOverflowAction = async (action: () => void | Promise<void>) => {
  isOverflowOpen.value = false;
  await action();
};

const handleDocumentClick = () => {
  isOverflowOpen.value = false;
};

watch(isOverflowOpen, (open) => {
  if (open) {
    // Defer so the opening click does not immediately close the menu.
    setTimeout(() => {
      document.addEventListener("click", handleDocumentClick);
    }, 0);
  } else {
    document.removeEventListener("click", handleDocumentClick);
  }
});

const handleGlobalKeydown = (event: KeyboardEvent) => {
  if (!showSearchButton.value) return;
  const isModK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
  if (!isModK) return;

  event.preventDefault();
  if (isDesktop.value) {
    listSearchStore.open(route.path);
    void focusSearchInput();
    return;
  }

  void openListSearch();
};

const add = (currentRoute: typeof route) => {
  const routePath = currentRoute.path;
  const addMethodMap: Record<string, string> = {
    "/subs": "addSub",
  };
  methodStore.invokeMethod(addMethodMap[routePath], {});
};

const back = () => {
  if (!isNeedBack.value) return;

  try {
    if (router.options.history.state.back) {
      router.back();
    } else {
      router.push("/");
    }
  } catch {
    router.push("/");
  }
};

const refresh = async () => {
  if (["/preview"].includes(route.path)) {
    window.location.reload();
  } else if (["/subs"].includes(route.path)) {
    initStores(true, true, true);
  } else {
    showNotify({ title: i18n_global("globalNotify.refresh.loading"), type: "primary" });
    await initStores(true, true, true);
  }
};
</script>

<style lang="scss">
.nav-bar-wrapper {
  top: 0;
  height: v-bind(navBarHeight);
  z-index: 20;
  @include centered-fixed-container;
}

.nav-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  box-sizing: border-box;
  width: 100%;
  height: v-bind(navBarHeight);
  padding: v-bind(navBartop) 12px 0;
  box-shadow: none;
  backdrop-filter: blur(var(--nav-bar-blur));
  -webkit-backdrop-filter: blur(var(--nav-bar-blur));
  background: var(--nav-bar-color);
  border-bottom: 1px solid var(--divider-color);
  border-radius: 0;
  overflow: visible;

  @media screen and (min-width: $breakpoint-md) {
    padding-left: 20px;
    padding-right: 20px;
  }

  &__left,
  &__right {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
    min-width: 0;
  }

  &__left {
    max-width: min(46vw, 200px);
  }

  &__right {
    margin-left: auto;
    position: relative;
  }

  &__center {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &.is-desktop {
    .nav-bar__left {
      flex: 0 0 auto;
      max-width: 220px;
    }

    .nav-bar__center {
      justify-content: center;
      max-width: 520px;
      margin: 0 auto;
    }

    .nav-bar__right {
      flex: 0 0 auto;
      min-width: 72px;
      justify-content: flex-end;
    }
  }

  &.is-search-expanded {
    .nav-bar__left {
      display: none;
    }

    .nav-bar__center {
      justify-content: stretch;
    }
  }
}

.nav-title {
  margin: 0;
  min-width: 0;
  max-width: 100%;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--primary-text-color);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-btn {
  width: 32px;
  height: 32px;
  box-sizing: border-box;
  padding: 0;
  border: 0;
  margin: 0;
  background: transparent;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--icon-nav-bar-right);
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;

  &:hover {
    background: rgba(148, 163, 184, 0.15);
  }

  &:focus {
    outline: none;
  }

  &:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  &.is-active {
    color: var(--primary-color);
    background: color-mix(in srgb, var(--primary-color) 12%, transparent);
  }

  &__icon {
    width: 14px;
    height: 14px;
    font-size: 14px;
  }
}

.nav-search-field {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
}

.nav-search-field__icon {
  position: absolute;
  left: 12px;
  width: 12px;
  height: 12px;
  color: var(--comment-text-color);
  pointer-events: none;
}

.nav-search-input {
  width: 100%;
  min-width: 0;
  height: 32px;
  box-sizing: border-box;
  border: 1px solid var(--divider-color);
  border-radius: 20px;
  background: var(--card-color);
  color: var(--primary-text-color);
  padding: 0 30px 0 32px;
  font-size: 13px;
  line-height: 32px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &::placeholder {
    color: var(--comment-text-color);
  }

  &::-webkit-search-cancel-button,
  &::-webkit-search-decoration {
    -webkit-appearance: none;
    appearance: none;
    display: none;
  }

  &:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 15%, transparent);
  }
}

.nav-search-clear {
  position: absolute;
  right: 6px;
  top: 50%;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  margin: 0;
  background: transparent;
  color: var(--comment-text-color);
  transform: translateY(-50%);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 13px;
    height: 13px;
  }
}

.nav-overflow {
  position: relative;

  &__menu {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    z-index: 30;
    min-width: 160px;
    padding: 6px;
    border-radius: 10px;
    border: 1px solid var(--divider-color);
    background: var(--card-color);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }

  &__item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--primary-text-color);
    font-size: 13px;
    text-align: left;
    cursor: pointer;

    svg {
      width: 14px;
      height: 14px;
      color: var(--comment-text-color);
    }

    &:hover {
      background: rgba(148, 163, 184, 0.12);
    }
  }
}

.app-brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  max-width: 100%;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 0.85;
  }

  &:focus {
    outline: none;
  }

  &:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
    border-radius: 6px;
  }

  &__logo {
    width: 22px;
    height: 22px;
    flex-shrink: 0;
    border-radius: 6px;
    object-fit: contain;
  }

  &__name {
    font-weight: 600;
    font-size: var(--text-base);
    letter-spacing: -0.02em;
    color: var(--primary-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__badge {
    flex-shrink: 0;
    font-family: var(--font-mono);
    font-size: 10px;
    padding: 1px 6px;
    border-radius: var(--radius-full);
    background: color-mix(in srgb, var(--primary-color) 10%, transparent);
    color: var(--primary-color);
    border: 1px solid color-mix(in srgb, var(--primary-color) 22%, transparent);
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.05em;
  }
}
</style>
