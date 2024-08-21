<script setup>
import {useRoute, useRouter} from "vue-router";
import {useMessage} from "naive-ui";
import {getStore, Stat} from "./store";

const store = getStore()
const route = useRoute()
const router = useRouter()
const stats = store.stats
const message = useMessage()
const dialog = useDialog();

function parseImport(){
  if (route.params.importData !== undefined){
    const d = Stat.import("",route.params.importData)
    if (d===null){
      message.error("無效的檔案連結");
    }else {
      store.stats.push(d)
      message.success("成功導入檔案：" + d.showName);
      store.save()
    }
    router.push(`/stat-calc`)
  }
}
watch(
    ()=>route.params,
    (toParams, previousParams) => {
      parseImport()
    }
)
parseImport()

function add() {
  let index = store.add()
  open(index)
}
function open(index){
  router.push(`/stat-calc/${index}`)
}
const shareLink = computed(()=>{
  return function (stats) {
    return `${location.href}/import/${stats.exportData}`
  }
})

function showLink(item) {
  dialog.info({
    title:'檔案連結',
    content:shareLink.value(item),
    positiveText:'好',
  })
}

</script>

<template>
  <n-page-header title="瀏覽器已儲存的檔案">
    <n-empty v-if="stats.length===0" description="瀏覽器未儲存任何檔案">
    </n-empty>
    <n-list bordered>
      <n-list-item v-for="(item,index) in stats">
        <n-space justify="space-between">
          <n-button text size="large" @click="open(index)">{{item.showName}}</n-button>
          <n-space justify="end">
            <n-button @click="showLink(item)" text>分享</n-button>
            <n-popconfirm
                @positive-click="stats.splice(index,1) ; store.save()"
                negative-text="不"
                positive-text="好"
            >
              <template #trigger>
                <n-button text>刪除</n-button>
              </template>
              刪除後將無法找回！
            </n-popconfirm>
          </n-space>
        </n-space>
      </n-list-item>
    </n-list>
    <template #extra>
      <n-space>
        <n-button @click="add">新增檔案</n-button>
      </n-space>
    </template>
  </n-page-header>
</template>

<style scoped>

</style>