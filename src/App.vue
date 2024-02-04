<script setup>
import SiteHeader from "./components/SiteHeader.vue";
import {useTheme} from "@/assets/store.js";
const theme = useTheme()
</script>

<template>
  <n-config-provider :theme="theme">
    <n-loading-bar-provider>
      <n-message-provider>
        <n-notification-provider>
          <n-dialog-provider>
            <n-layout>
              <n-layout-header><site-header /></n-layout-header>
              <n-layout-content content-style="padding: 24px;">
                <router-view></router-view>
              </n-layout-content>
            </n-layout>
          </n-dialog-provider>
        </n-notification-provider>
      </n-message-provider>
    </n-loading-bar-provider>
    <n-global-style />
  </n-config-provider>
</template>

<style scoped>
</style>
