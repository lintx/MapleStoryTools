<script setup>
import {Calculation} from "@vicons/carbon";

const tools = [
  {
    icon:Calculation,
    title:'屬性計算器',
    path:'/stat-calc',
    desc:'根據角色屬性計算收益等',
  }
]
</script>

<template>
  <n-grid x-gap="12" :cols="4">
    <n-gi v-for="tool in tools">
      <n-card>
        <template #header>
          <router-link :to="tool.path">{{tool.title}}</router-link>
        </template>
        <template #cover>
          <n-icon :component="tool.icon" size="300" />
        </template>
        {{tool.desc}}
      </n-card>
    </n-gi>
  </n-grid>
</template>

<style scoped>

</style>