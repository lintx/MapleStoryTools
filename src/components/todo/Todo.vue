<script setup>
import {NButton, useDialog, useMessage} from "naive-ui";

const dialog = useDialog();
const dbRequest = indexedDB.open(`todo`,1)
const profiles = ref([])
const todoList = ref([])
const showProfiles = ref([])
const data = computed(() => {
  const result = []
  const tmpProfile = {}
  for (const item of profiles.value){
    const tmp = {...item}
    tmp.children = []
    result.push(tmp)
    tmpProfile[tmp.id] = tmp
    tmp.children.push({id:100,name:'abc'})
  }
  const delIds = []
  for (const item of todoList.value){
    if (tmpProfile.hasOwnProperty(item.profile_id)){
      const p = tmpProfile[item.profile_id]
      p.children.push({...item})
    }else {
      deleteTodoItem(item.id)
      delIds.push(item.id)
    }
  }
  deleteRefTodoItems(delIds)
  return result
});
let db;
dbRequest.onsuccess = ()=>{
  db = dbRequest.result
  db.onversionchange = ()=>{
    db.close()
    dialog.error({
      title: "錯誤",
      content: "版本已更新，請刷新",
      positiveText: "好",
      onPositiveClick: () => {
        location.reload()
      }
    });
  }
  //加載所有數據
  const {storeProfile,storeList} = getStores()
  storeProfile.openCursor().onsuccess = event => {
    const cursor = event.target.result
    if (cursor) {
      profiles.value.push(cursor.value)
      showProfiles.value.push(cursor.value.id)
      cursor.continue()
    }
  }
  storeList.openCursor().onsuccess = event => {
    const cursor = event.target.result
    if (cursor) {
      todoList.value.push(cursor.value)
      cursor.continue()
    }
  }
}
function getStores(type="readonly"){
  const trans = db.transaction([`profile`,`list`],type)
  const storeProfile = trans.objectStore(`profile`)
  const storeList = trans.objectStore(`list`)
  return {storeProfile, storeList}
}
dbRequest.onerror = ()=>{

}
dbRequest.onupgradeneeded = (event)=>{
  const db = dbRequest.result
  const ov = event.oldVersion
  const nv = event.newVersion
  console.log(ov,nv)
  for (let i=ov; i<nv;i++){
    console.log("oldVersion:",ov)
    switch(i){
      case 0:
        const stores = [`profile`,`list`]
        for (const store of stores){
          if (!db.objectStoreNames.contains(store))
            db.createObjectStore(store,{autoIncrement:true,keyPath:"id"})
        }
        break
    }
  }
}

function deleteTodoItem(id){
  const {storeList} = getStores(`readwrite`)
  storeList.delete(id)
}
function deleteRefTodoItems(ids){
  for(let i=ids.length-1;i>=0;i++){
    for (let j=todoList.value.length-1;i>=0;i--){
      if (todoList.value[j].id===ids[i]) todoList.value.splice(j,1)
    }
  }
}
function formatDbData(item, val) {
  if (typeof val === "object"){
    for (const k in item){
      if (val.hasOwnProperty(k)){
        item[k] = item[k]
      }
    }
    if (val.hasOwnProperty("id")){
      item.id = val.id
    }
  }
}
function formatProfile(val){
  const item = {
    name: "",
  }
  formatDbData(item,val)
}
function formatToItem(val){
  const item = {
    profile_id:0,
    name:"",
    start_time:new Date(),
    end_time:new Date(),
    refresh_type:0,
    refresh_day:0,
    event_count:1,
    done_count:0,
    on_done_time:new Date(),
    is_notify:true,
    notify_time:new Date(),
    on_notify_time:new Date(),
  }
  formatDbData(item,val)
}
function deleteProfile(id){
  const {storeProfile} = getStores(`readwrite`)
  storeProfile.delete(id)
  for (let j=profiles.value.length-1;i>=0;i--){
    if (profiles.value[j].id===id) profiles.value.splice(j,1)
  }
  const ids = []
  for (const item of todoList.value){
    if (item.profile_id===id) {
      ids.push(item.id)
      deleteTodoItem(item.id)
    }
  }
  deleteRefTodoItems(ids)
}
function changeProfile(val) {
  ///調用前應先使用{...xx}拷貝原始數據，再修改，最後調用
  const {storeProfile} = getStores(`readwrite`)
  const item = {...val}
  for (const [i,v] of profiles.value.entries()){
    if (v.id===item.id) {
      storeProfile.put(item,v.id).onsuccess = event => {
        profiles.value[i] = item
      }
      return
    }
  }
}
function changeTodo(val){
  ///調用前應先使用{...xx}拷貝原始數據，再修改，最後調用
  const {storeList} = getStores(`readwrite`)
  const item = {...val}
  for (const [i,v] of todoList.value.entries()){
    if (v.id===item.id) {
      storeList.put(item,v.id).onsuccess = event => {
        todoList.value[i] = item
      }
      return
    }
  }
}
function addProfile(val){
  const {storeProfile} = getStores(`readwrite`)
  console.log(storeProfile)
  const item = {...val}
  storeProfile.add(item).onsuccess = event => {
    item.id = event.target.result
    profiles.value.push(item)
    showProfiles.value.push(item.id)
  }
}
function addTodo(val){
  const {storeList} = getStores(`readwrite`)
  const item = {...val}
  storeList.add(item).onsuccess = event => {
    item.id = event.target.result
    todoList.value.push(item)
  }
}


const editGroupData = ref({
  add:true,
  item:{},
  show:false,
})
function addGroupClick(){
  editGroupData.value.add = true
  editGroupData.value.item = {name:""}
  editGroupData.value.show = true
}
function editGroup(item){
  editGroupData.value.add = false
  editGroupData.value.item = {...item}
  editGroupData.value.show = true
}
function editGroupNameSubmit(){
  if (editGroupData.value.item.name==="") return
  if(editGroupData.value.add){
    addProfile(editGroupData.value.item)
  }else {
    changeProfile(editGroupData.value.item)
  }
  editGroupData.value.show = false
}
</script>

<template>
  <n-modal v-model:show="editGroupData.show" preset="dialog" :title="editGroupData.add?'新增分組':'修改分組'" positive-text="確認" negative-text="取消" @positive-click="editGroupNameSubmit">
    <div>
      <n-form label-placement="left" label-width="auto" require-mark-placement="right-hanging">
        <n-form-item label="分組名" path="inputValue">
          <n-input v-model:value="editGroupData.item.name" placeholder="分組名,e.g:本尊" />
        </n-form-item>
      </n-form>
    </div>
  </n-modal>

  <n-space vertical>
    <n-page-header title="">
      <n-empty v-if="data.length===0" description="還沒有待辦事項">
      </n-empty>
      <template #extra>
        <n-space>
          <n-button @click="addGroupClick">新增分組</n-button>
        </n-space>
      </template>
      <n-collapse v-model:expanded-names="showProfiles" :trigger-areas="['main', 'arrow']" display-directive="show">
        <template v-for="(item,index) in data">
          <n-collapse-item :title="item.name" :name="item.id">
            <n-list>
              <template v-for="todo in item.children">
                <n-list-item>
                  <n-thing title="Thing">
                    <template #header-extra>
                      <n-space>
                        <n-button>刪除</n-button>
                        <n-button>修改</n-button>
                        <n-button>完成</n-button>
                      </n-space>
                    </template>
                    <template #header>
                      {{todo.name}}
                    </template>
                    <template #description>
                      description
                    </template>
                  </n-thing>
                </n-list-item>
              </template>
            </n-list>
            <template #header-extra>
              <n-space>
                <n-button @click="console.log('a')">刪除</n-button>
                <n-button @click="console.log('a')">改名</n-button>
                <n-button @click="console.log('a')">新增</n-button>
              </n-space>
            </template>
          </n-collapse-item>
        </template>
      </n-collapse>
    </n-page-header>
  </n-space>
</template>

<style scoped>

</style>