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
    // tmp.children.push({id:100,name:'abc'})
  }
  for (const item of todoList.value){
    if (tmpProfile.hasOwnProperty(item.profile_id)){
      const p = tmpProfile[item.profile_id]
      p.children.push({...item})
    }else {
      deleteTodoItem(item.id)
    }
  }
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
  deleteRefTodoItems([id])
}
function deleteRefTodoItems(ids){
  for(let i=ids.length-1;i<ids.length;i++){
    for (let j=todoList.value.length-1;j>=0;j--){
      if (todoList.value[j].id===ids[i]) todoList.value.splice(j,1)
    }
  }
}
function formatDbData(item, val) {
  if (typeof val === "object"){
    for (const k in item){
      if (val.hasOwnProperty(k)){
        item[k] = val[k]
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
    refresh_day:1,
    event_count:1,
    done_count:0,
    on_done_time:new Date(),
    is_notify:true,
    notify_time:"20:00",
    on_notify_time:new Date(),
  }
  formatDbData(item,val)
  return item
}
function deleteProfile(id){
  const {storeProfile} = getStores(`readwrite`)
  storeProfile.delete(id)
  for (let j=profiles.value.length-1;j>=0;j--){
    if (profiles.value[j].id===id) profiles.value.splice(j,1)
  }
  for (const item of todoList.value){
    if (item.profile_id===id) {
      deleteTodoItem(item.id)
    }
  }
}
function changeProfile(val) {
  ///調用前應先使用{...xx}拷貝原始數據，再修改，最後調用
  const {storeProfile} = getStores(`readwrite`)
  const item = {...val}
  delete item.children
  for (const [i,v] of profiles.value.entries()){
    if (v.id===item.id) {
      storeProfile.put(item).onsuccess = event => {
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
      storeList.put(item).onsuccess = event => {
        todoList.value[i] = item
      }
      return
    }
  }
}
function addProfile(val){
  const {storeProfile} = getStores(`readwrite`)
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

const weeks = [
  {label:"週一",value:1},
  {label:"週四",value:4},
  {label:"週二",value:2},
  {label:"週三",value:3},
  {label:"週五",value:5},
  {label:"週六",value:6},
  {label:"週日",value:0},
]

const editTodo = ref({
  add:true,
  show:false,
  item:formatToItem({})
})
function addTodoClick(id){
  editTodo.value.add = true
  editTodo.value.item = formatToItem({profile_id:id})
  editTodo.value.show = true
}
function editTodoClick(item){
  editTodo.value.add = false
  editTodo.value.item = formatToItem(item)
  editTodo.value.show = true
}
function editTodoSubmit(){
  if (editTodo.value.item.name==="") return
  if(editTodo.value.add){
    addTodo(editTodo.value.item)
  }else {
    changeTodo(editTodo.value.item)
  }
  editTodo.value.show = false
}
function getDesc(item){
  let text = ``
  if (item.refresh_type===0){
    text += `每日重置`
  }else {
    text += `${item.done_count}/${item.event_count}次`
    for (const w of weeks){
      if (w.value===item.refresh_type){
        text += `，${w.label}重置`
        break
      }
    }
  }
  return text
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
  <n-modal v-model:show="editTodo.show" preset="dialog" :title="editTodo.add?'新增事項':'修改事項'" positive-text="確認" negative-text="取消" @positive-click="editTodoSubmit">
    <div>
      <n-form label-placement="left" label-width="auto" require-mark-placement="right-hanging">
        <n-form-item label="事項名" path="inputValue">
          <n-input v-model:value="editTodo.item.name" placeholder="事項名,e.g:打里程王" />
        </n-form-item>
        <n-form-item label="事項週期" path="radioGroupValue">
          <n-radio-group v-model:value="editTodo.item.refresh_type" name="bonus-radio-group">
            <n-space>
              <n-radio :value="0">每日重置</n-radio>
              <n-radio :value="1">每周重置</n-radio>
            </n-space>
          </n-radio-group>
        </n-form-item>
        <n-form-item v-if="editTodo.item.refresh_type===1" label="重置時機" feedback="將在選擇日期的凌晨對事項重置為未完成狀態">
          <n-select
              v-model:value="editTodo.item.refresh_day"
              placeholder="週幾重置？"
              :options="weeks"
          />
        </n-form-item>
        <n-form-item v-if="editTodo.item.refresh_type===1" label="每週幾次" path="inputValue">
          <n-input-number v-model:value="editTodo.item.event_count" min="1" max="7" placeholder="每週幾次" />
        </n-form-item>
        <n-form-item label="開啟通知" path="inputValue" feedback="需要允許瀏覽器通知">
          <n-switch v-model:value="editTodo.item.is_notify" />
        </n-form-item>
        <n-form-item v-if="editTodo.item.is_notify" label="通知時間" path="inputValue">
          <n-time-picker
              v-model:formatted-value="editTodo.item.notify_time"
              :minutes="5"
              format="HH:mm"
          />
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
            <template #header-extra>
              <n-space>
                <n-popconfirm
                    @positive-click="deleteProfile(item.id)"
                    negative-text="不"
                    positive-text="好"
                >
                  <template #trigger>
                    <n-button>刪除</n-button>
                  </template>
                  刪除後將無法找回！
                </n-popconfirm>
                <n-button @click="editGroup(item)">改名</n-button>
                <n-button @click="addTodoClick(item.id)">新增事項</n-button>
              </n-space>
            </template>
            <n-list>
              <template v-for="todo in item.children">
                <n-list-item>
                  <n-thing title="Thing">
                    <template #header-extra>
                      <n-space>
                        <n-popconfirm
                            @positive-click="deleteTodoItem(todo.id)"
                            negative-text="不"
                            positive-text="好"
                        >
                          <template #trigger>
                            <n-button>刪除</n-button>
                          </template>
                          刪除後將無法找回！
                        </n-popconfirm>
                        <n-button @click="editTodoClick(todo)">修改</n-button>
                        <n-button>完成</n-button>
                      </n-space>
                    </template>
                    <template #header>
                      {{todo.name}}
                    </template>
                    <template #description>
                      {{getDesc(todo)}}
                    </template>
                  </n-thing>
                </n-list-item>
              </template>
            </n-list>
          </n-collapse-item>
        </template>
      </n-collapse>
    </n-page-header>
  </n-space>
</template>

<style scoped>

</style>