<template>
  <div class="nav-bar-wrapper">
    <nav class="nav-bar" :class="{ 'is-desktop': isDesktop }">
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
          v-else
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
            width="20"
            height="20"
          />
          <span class="app-brand__name">Sub Store</span>
        </div>
      </div>

      <div class="nav-bar__center">
        <div v-if="!isNeedBack" class="nav-segmented-control">
          <button
            v-for="item in navTabs"
            :key="item.path"
            type="button"
            class="nav-segmented-item"
            :class="{ 'is-active': route.path === item.path }"
            @click="router.push(item.path)"
          >
            <font-awesome-icon :icon="item.icon" class="nav-segmented-item__icon" />
            <span>{{ item.label }}</span>
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
        <LanguageSwitcherButton variant="icon" />
        <button
          type="button"
          class="nav-btn"
          :aria-label="themeActionLabel"
          :title="themeActionLabel"
          @click.stop="toggleTheme"
        >
          <font-awesome-icon
            class="nav-btn__icon"
            :icon="themeActionIcon"
          />
        </button>
      </div>
    </nav>
  </div>
</template>

<script lang="ts" setup>
import { useMediaQuery } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import brandLogo from "@/assets/icons/logo.png";
import LanguageSwitcherButton from "@/components/LanguageSwitcherButton.vue";
import { useSettingsStore } from "@/store/settings";
import { SIDEBAR_BREAKPOINT, useSystemStore } from "@/store/system";
import { initStores } from "@/utils/initApp";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const systemStore = useSystemStore();
const settingsStore = useSettingsStore();
const { appearanceSetting } = storeToRefs(settingsStore);
const { navBarHeight, navBartop } = storeToRefs(systemStore);

const isDesktop = useMediaQuery(`(min-width: ${SIDEBAR_BREAKPOINT}px)`);

onMounted(() => {
  systemStore.initSystemState();
});

const isNeedBack = computed(() => {
  return route.meta.needNavBack ?? false;
});

const navTabs = computed(() => [
  { path: "/subs", label: t("tabBar.sub"), icon: "fa-solid fa-link" },
  { path: "/tools", label: t("tabBar.tools"), icon: "fa-solid fa-sliders" },
  { path: "/my", label: t("tabBar.my"), icon: "fa-solid fa-gear" },
]);

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
    return;
  }
  // Explicit user refresh: loading + success toasts handled inside initStores.
  await initStores(true, true, true);
};

const isDarkTheme = computed(() => {
  if (settingsStore.theme?.auto) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  const name = settingsStore.theme?.name || "light";
  return ["dark", "pureblack", "darkblue", "monokai"].includes(name);
});

/** Cycle: System (auto) → Light → Dark → System */
const themeMode = computed<"auto" | "light" | "dark">(() => {
  if (settingsStore.theme?.auto) return "auto";
  return isDarkTheme.value ? "dark" : "light";
});

const themeActionIcon = computed(() => {
  if (themeMode.value === "auto") return "fa-solid fa-circle-half-stroke";
  if (themeMode.value === "dark") return "fa-solid fa-sun";
  return "fa-solid fa-moon";
});

const themeActionLabel = computed(() => {
  if (themeMode.value === "auto") return t("navBar.actions.themeAuto");
  if (themeMode.value === "dark") return t("navBar.actions.themeDark");
  return t("navBar.actions.themeLight");
});

const toggleTheme = async () => {
  const current = settingsStore.theme || {
    auto: true,
    name: "light",
    dark: "dark",
    light: "light",
  };
  let next;
  if (current.auto) {
    // System → fixed Light
    next = { ...current, auto: false, name: "light" as const };
  } else if (!isDarkTheme.value) {
    // Light → fixed Dark
    next = { ...current, auto: false, name: "dark" as const };
  } else {
    // Dark → System (follow device)
    next = { ...current, auto: true, name: current.light || "light" };
  }
  settingsStore.theme = next as any;
  await settingsStore.changeTheme({ theme: next as any });
};
</script>

<style lang="scss" scoped>
/*
 * Full-bleed fixed top bar.
 * Height is hardcoded to 56px (with CSS-var override from the store) so the
 * layout cannot collapse if Vue style-bindings fail to inject.
 */
.nav-bar-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  width: 100%;
  height: 56px;
  height: v-bind(navBarHeight);
  min-height: 56px;
  box-sizing: border-box;
  background: var(--nav-bar-color, #fff);
  border-bottom: 1px solid var(--divider-color, rgba(0, 0, 0, 0.08));
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

/*
 * Single horizontal row: logo | tabs | actions.
 * max-width matches .page-body so left/right edges align with the list.
 */
.nav-bar {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: nowrap !important;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  box-sizing: border-box;
  width: 100%;
  max-width: $content-max-width;
  height: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-top: 0;
  padding-top: v-bind(navBartop);
  padding-right: 16px;
  padding-bottom: 0;
  padding-left: 16px;
  overflow: visible;

  @media screen and (min-width: $breakpoint-md) {
    padding-left: 24px;
    padding-right: 24px;
  }

  &__left,
  &__right,
  &__center {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    align-items: center;
    min-width: 0;
  }

  &__left,
  &__right {
    gap: 8px;
    flex: 0 0 auto;
  }

  &__center {
    justify-content: center;
    flex: 1 1 auto;
  }
}

.app-brand {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;

  &__logo {
    display: block;
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    object-fit: contain;
  }

  &__name {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: -0.015em;
    color: var(--primary-text-color);
    white-space: nowrap;
  }
}

.nav-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.015em;
  color: var(--primary-text-color);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-segmented-control {
  display: inline-flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  padding: 3px;
  border-radius: 9999px;
  background: rgba(148, 163, 184, 0.08);
  border: 1px solid var(--divider-color);
  gap: 2px;
}

.nav-segmented-item {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  padding: 4px 14px;
  border: 0;
  border-radius: 9999px;
  background: transparent;
  color: var(--second-text-color);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1), background-color 200ms ease, color 200ms ease, box-shadow 200ms ease;

  @media (hover: hover) and (pointer: fine) {
    &:hover:not(.is-active) {
      color: var(--primary-text-color);
      background: rgba(148, 163, 184, 0.12);
    }
  }

  &:active {
    transform: scale(0.96);
  }

  &.is-active {
    background: var(--card-color);
    color: var(--primary-text-color);
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  }

  &__icon {
    font-size: 12px;
  }
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
  color: var(--second-text-color);
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1), background-color 200ms ease, color 200ms ease;

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: rgba(148, 163, 184, 0.15);
      color: var(--primary-text-color);
    }
  }

  &:active {
    transform: scale(0.95);
  }

  &:focus {
    outline: none;
  }

  &__icon {
    width: 14px;
    height: 14px;
    font-size: 14px;
  }
}
</style>
