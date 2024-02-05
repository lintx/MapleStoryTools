<script setup>
import * as stat from "@/utils/stat.js";
import {useRoute, useRouter} from "vue-router";
import {useMessage} from "naive-ui";

const store = stat.getStore()
const jobs = stat.getJobs()
const jobGroups = stat.getJobGroups()
const props = stat.getPropNames()
const calcStats = stat.getCalcStats()
const route = useRoute()
const router = useRouter()
const message = useMessage()

let stopSw = null
let index = ref(null),stats = ref(null),showName = ref(null),imdrRef = ref(null),calcSource = ref(null)
function parseIndex(){
  stopSw !== null && stopSw
  index.value = parseInt(route.params.index)
  if (isNaN(index.value) || index.value < 0 || index.value >= store.stats().length){
    message.error("無效的檔案");
    router.push(`/stat-calc`)
    index.value = store.stats()[store.stats().length-1]
  }
  stats.value = store.stats()[index.value]
  calcSource.value = stats.value.calcSource
  // console.log(stats)
  showName.value = stats.value.showName()
  imdrRef.value = stats.value.calcImdr()
  stopSw = watch(stats.value.data,()=>{
    store.save()
  })
}
watch(
    ()=>route.params,
    (toParams, previousParams) => {
      parseIndex()
    }
)
parseIndex()
const gis = "xs:24 s:12 m:8 l:6 xl:4 xxl:4"
const calcStatsOptions = Object.keys(calcStats).map(k=>{return {label:props[k],value:k}})
const jobOptions = []
for (const item of jobGroups){
  const child = {
    type: "group",
    label: item.name,
    key: item.name,
    children: [],
  }
  for (const cItem of item.child){
    let key = cItem.toString()
    child.children.push({
      label: jobs[key].name,
      value: key
    })
  }
  jobOptions.push(child)
}

function calcSP(t) {
  if (stats.value.data["inc"+t]===0) {
    message.error("吃藥增加的屬性為0，無法計算%數");
    return
  }
  const add = stats.value.data[t+"A"] - stats.value.data[t]
  switch (t) {
    case "str":
    case "int":
    case "luk":
    case "dex":
      stats.value.data[t+"R"] = Math.ceil((add / stats.value.data["inc"+t] - 1) * 100)
      break
    case "hp":
      const chp = add / stats.value.data["inc"+t] * 100
      stats.value.data[t+"R"] = Math.ceil(((stats.value.data[t] - stats.value.data[t+"D"]) / chp - 1) * 100)
      break
  }
}

function statIsShow(s) {
  return jobs.hasOwnProperty(stats.value.data.job) && (jobs[stats.value.data.job].ps.indexOf(s)>=0 || jobs[stats.value.data.job].ss.indexOf(s)>=0)
}

function statLabel(s) {
  let desc = ""
  if (statIsShow(s)){
    if (jobs[stats.value.data.job].ps.indexOf(s)>=0){
      desc = "[主屬]"
    }else if (jobs[stats.value.data.job].ss.indexOf(s)>=0){
      desc = "[副屬]"
    }
  }
  return `${props[s]}${desc}（乾淨屬性、吃藥增加量、吃藥後屬性、最終屬性、屬性%）`
}

const numberFormat = computed(()=>{
  return function (val) {
    let n
    if (typeof val==="number") n = val
    else if (isRef(val)) n = val.value
    else return val

    if (typeof n!=="number") return n
    let counter = 0;
    let units = ['兆 ','億 ','萬 ']
    let result = []
    const num = Math.floor(n).toString().split('');
    for (let i = num.length - 1; i >= 0; i--) {
      counter++;
      result.unshift(num[i]);
      if (!(counter % 4) && i !== 0) {
        result.unshift(units.pop());
      }
    }
    return result.join('');
  }
})

function handleBack() {
  router.push(`/stat-calc`)
}

</script>

<template>
  <n-page-header :title="showName.value" @back="handleBack">
    <n-card>
      <n-tabs default-value="input" size="large" justify-content="space-evenly">
        <n-tab-pane name="input" tab="屬性設定">
          <n-form>
            <n-collapse :default-expanded-names="['1', '2', '3', '4']">
              <n-collapse-item title="等級、職業" name="1">
                <n-grid item-responsive responsive="screen">
                  <n-form-item-gi :label="props.level" :span="gis">
                    <n-input-number min="0" max="300" v-model:value="stats.data.level" />
                  </n-form-item-gi>
                  <n-form-item-gi :label="props.job" :span="gis">
                    <n-select
                        v-model:value="stats.data.job"
                        placeholder="請選擇職業/武器"
                        :options="jobOptions"
                    />
                  </n-form-item-gi>
                </n-grid>
              </n-collapse-item>
              <n-collapse-item title="常規屬性" name="2">
                <n-space vertical>
                  <n-alert :show-icon="false">
                    傷害%、最終傷害%、爆擊傷害%、攻擊力/魔法攻擊力、攻擊力%/魔法攻擊力%、BOSS傷害按照遊戲ui中對應數值填寫即可，注意攻擊力/魔法攻擊力需要填寫未經%加成的原始數值，即滑鼠放在攻擊力/魔法攻擊力位置時出現的詳細UI中具體數值相加後的結果。
                  </n-alert>
                  <n-grid item-responsive responsive="screen">
                    <n-form-item-gi :label="props.damR" :span="gis">
                      <n-input-number min="0" v-model:value="stats.data.damR">
                        <template #suffix>
                          %
                        </template>
                      </n-input-number>
                    </n-form-item-gi>
                    <n-form-item-gi :label="props.pmdR" :span="gis">
                      <n-input-number min="0" v-model:value="stats.data.pmdR">
                        <template #suffix>
                          %
                        </template>
                      </n-input-number>
                    </n-form-item-gi>
                    <n-form-item-gi :label="props.cdR" :span="gis">
                      <n-input-number min="0" v-model:value="stats.data.cdR">
                        <template #suffix>
                          %
                        </template>
                      </n-input-number>
                    </n-form-item-gi>
                    <n-form-item-gi :label="props.pmad" :span="gis">
                      <n-input-number min="0" v-model:value="stats.data.pmad">
                      </n-input-number>
                    </n-form-item-gi>
                    <n-form-item-gi :label="props.pmadR" :span="gis">
                      <n-input-number min="0" v-model:value="stats.data.pmadR">
                        <template #suffix>
                          %
                        </template>
                      </n-input-number>
                    </n-form-item-gi>
                    <n-form-item-gi :label="props.pmadD" :span="gis">
                      <n-input-number min="0" v-model:value="stats.data.pmadD">
                      </n-input-number>
                    </n-form-item-gi>
                    <n-form-item-gi :label="props.bdR" :span="gis">
                      <n-input-number min="0" v-model:value="stats.data.bdR">
                        <template #suffix>
                          %
                        </template>
                      </n-input-number>
                    </n-form-item-gi>
                  </n-grid>
                </n-space>
              </n-collapse-item>
              <n-collapse-item title="無視防禦率" name="3">
                <n-space vertical>
                  <n-alert :show-icon="false">
                    無視防禦率可以按照ui顯示的最終無視填寫單條無視，也可以按照滑鼠放在無視上顯示的具體條數對應填寫，但是建議按照具體條數對應填寫，因為按照ui顯示填寫會損失部分小數，按照具體條數填寫更準確。
                  </n-alert>
                  <n-grid item-responsive responsive="screen">
                    <n-form-item-gi :span="gis">
                      <n-button attr-type="button" @click="stats.data.imdR.push(0)">
                        增加無視防禦率
                      </n-button>
                    </n-form-item-gi>
                    <n-form-item-gi
                        v-for="(item, index) in stats.data.imdR"
                        :label="`${props.imdR}${index + 1}`"
                        :span="gis"
                    >
                      <n-input-number min="0" max="100" v-model:value="stats.data.imdR[index]">
                        <template #suffix>
                          %
                        </template>
                      </n-input-number>
                      <n-button style="margin-left: 12px" @click="stats.data.imdR.splice(index, 1)">
                        刪除
                      </n-button>
                    </n-form-item-gi>
                  </n-grid>
                </n-space>
                <template #header-extra>
                  {{imdrRef.value}}%
                </template>
              </n-collapse-item>
              <n-collapse-item title="主副屬" name="4">
                <n-space vertical>
                  <n-alert :show-icon="false">
                    屬性填寫方法：先填寫當前屬性、最終屬性（ARC、AUT、極限屬性、聯盟角色卡、內潛、HEXA屬性），然後通過吃藥等手段提升屬性（推薦拍賣拉最上級祝福秘藥、傳說中的祝福秘藥等全屬性增加固定數值的秘藥），並在吃藥增加屬性中填寫增加的屬性，和吃藥後屬性，之後點按右側的“重算%”按鈕即可。如果不嫌麻煩也可以自己手動計算屬性%，此時可不填吃藥增加的屬性、吃藥後的屬性，但是依然要填寫未吃藥時的屬性和最終屬性<br>
                    對於惡復，應在正確填寫其他屬性後，使用三轉技能“急速療癒”或五轉技能“聖火”以增加hp%，並在吃藥增加的屬性中填寫對應的%數（25%或40%），填寫增加後的hp總量，然後點擊重算即可。
                  </n-alert>
                  <n-grid item-responsive responsive="screen">
                    <template v-for="s in ['hp','str','int','luk','dex']">
                      <n-form-item-gi :label="statLabel(s)" span="24" v-if="statIsShow(s)">
                        <n-input-group>
                          <n-input-number v-model:value="stats.data[s]" :placeholder="props[s]" />
                          <n-input-number v-model:value="stats.data['inc'+s]" :placeholder="props['inc'+s]">
                            <template v-if="s==='hp'" #suffix>
                              %
                            </template>
                          </n-input-number>
                          <n-input-number v-model:value="stats.data[s+'A']" :placeholder="props[s+'A']" />
                          <n-input-number v-model:value="stats.data[s+'D']" :placeholder="props[s+'D']" />
                          <n-input-number v-model:value="stats.data[s+'R']" :placeholder="props[s+'R']">
                            <template #suffix>
                              %
                            </template>
                          </n-input-number>
                          <n-button @click="calcSP(s)">
                            重算%
                          </n-button>
                        </n-input-group>
                      </n-form-item-gi>
                    </template>
                  </n-grid>
                </n-space>
              </n-collapse-item>
            </n-collapse>
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="result" tab="計算結果">
          <n-form>
            <n-collapse :default-expanded-names="['1','2']">
              <n-collapse-item title="素質" name="1">
                <n-grid item-responsive responsive="screen">
                  <n-gi :span="gis">
                    <n-popover trigger="hover">
                      <template #trigger>
                        表攻：{{numberFormat(stats.displayDamage())}}
                      </template>
                      <span>真攻 × (100% + 傷害%) × (100% + 總傷%)</span>
                    </n-popover>
                  </n-gi>
                  <n-gi :span="gis">
                    <n-popover trigger="hover">
                      <template #trigger>
                        真攻：{{numberFormat(stats.realDamage())}}
                      </template>
                      <span>武器係數({{stats.data.job===null?'-':jobs[stats.data.job].wm}}) × 屬性加權({{stats.statWeight().value}}) × 總攻擊力({{Math.floor(stats.data.pmad * (1+stats.data.pmadR/100))}}) ÷ 100</span>
                    </n-popover>
                  </n-gi>
                  <n-gi :span="gis">
                    <n-popover trigger="hover">
                      <template #trigger>
                        B攻：{{numberFormat(stats.bossDamage())}}
                      </template>
                      <span>真攻 × (100% + 傷害% + B傷%) × (100% + 總傷%)</span>
                    </n-popover>
                  </n-gi>
                  <n-form-item-gi label-placement="left" label="目標防禦%" :span="gis">
                    <n-input-number min="0" v-model:value="stats.def">
                      <template #suffix>
                        %
                      </template>
                    </n-input-number>
                  </n-form-item-gi>
                  <n-gi :span="gis">
                    <n-popover trigger="hover">
                      <template #trigger>
                        防後B攻：{{numberFormat(stats.defBossDamage())}}
                      </template>
                      <span>無視：{{imdrRef.value.toFixed(2)}}%，剩餘防禦：{{(100 - stats.remainingDef().value * 100).toFixed(2)}}%<br />B攻 × (100% - 剩餘防禦%)</span>
                    </n-popover>
                  </n-gi>
                  <n-gi :span="gis">
                    <n-popover trigger="hover">
                      <template #trigger>
                        防後暴B攻：{{numberFormat(stats.defBossCriticalDamage())}}
                      </template>
                      <span>防後B攻 × (135% + 爆傷%)，按平均爆傷計算</span>
                    </n-popover>
                  </n-gi>
                </n-grid>
              </n-collapse-item>
              <n-collapse-item title="等效換算" name="2">
                <n-space vertical>
                  <n-alert :show-icon="false">
                    填寫等效源的數值和類型後，可以看到對應數值的等效源等於多少其他屬性。<br>
                    帶“最終”字樣的屬性，如最終攻擊、最終str等，均不受%數加成。<br>
                    無視防禦視為增加一條無視而不是直接在當前無視的基礎上增加數值，比如當前無視80%，增加40%無視後，最終無視是88%而不是120%；相應的，等效結果中的無視也是等效源的數值相當於額外增加一條%數的無視的效果；無視的實際效果可能會受不顯示在ui中的無視（如部分5、6轉技能）影響而導致實際提升幅度沒有計算器計算的大，如需計算此部分無視的影響可以在屬性設定ui中增加此部分無視。<br>
                    由於傷害計算部分有大量需要“向下取整”的地方會捨去部分小數，所以有部分數據的換算會有一定誤差，可以調整等效源的數值以多次分析。<br>
                    對於惡復來說，由於計算實際hp時會減半計算，所以如果提升的hp來源為裝備等，需要將等效數值乘以2計算（%數正常計算即可）。
                  </n-alert>
                  <n-grid item-responsive responsive="screen">
                    <n-form-item-gi label="等效源" span="24">
                      <n-input-group>
                        <n-input-number v-model:value="calcSource.val">
                          <template v-if="calcSource.name.charAt(calcSource.name.length-1)==='R'" #suffix>
                            %
                          </template>
                        </n-input-number>
                        <n-select
                            v-model:value="calcSource.name"
                            placeholder="請選擇等效源屬"
                            :options="calcStatsOptions"
                        />
                      </n-input-group>
                    </n-form-item-gi>

                    <template  v-for="s in ['hp','str','int','luk','dex']">
                      <template v-if="statIsShow(s)">
                        <n-gi :span="gis">{{props[s]}}：{{stats.calcSourceResult().value[s]}}</n-gi>
                        <n-gi :span="gis">{{props[s+'R']}}：{{stats.calcSourceResult().value[s+'R']}}%</n-gi>
                        <n-gi :span="gis">{{props[s+'D']}}：{{stats.calcSourceResult().value[s+'D']}}</n-gi>
                      </template>
                    </template>
                    <n-gi :span="gis">{{props.pmad}}：{{stats.calcSourceResult().value.pmad}}</n-gi>
                    <n-gi :span="gis">{{props.pmadR}}：{{stats.calcSourceResult().value.pmadR}}%</n-gi>
                    <n-gi :span="gis">{{props.pmadD}}：{{stats.calcSourceResult().value.pmadD}}</n-gi>
                    <n-gi :span="gis">{{props.damR}}/{{props.bdR}}：{{stats.calcSourceResult().value.damR}}%</n-gi>
                    <n-gi :span="gis">{{props.imdR}}：{{stats.calcSourceResult().value.imdR}}%</n-gi>
                    <n-gi :span="gis">{{props.pmdR}}：{{stats.calcSourceResult().value.pmdR}}%</n-gi>
                    <n-gi :span="gis">{{props.cdR}}：{{stats.calcSourceResult().value.cdR}}%</n-gi>
                  </n-grid>
                </n-space>
              </n-collapse-item>
            </n-collapse>
          </n-form>
        </n-tab-pane>
      </n-tabs>
    </n-card>
<!--    <template #extra>-->
<!--      <n-space>-->
<!--        <n-button>help</n-button>-->
<!--      </n-space>-->
<!--    </template>-->
  </n-page-header>
</template>

<style scoped>

</style>