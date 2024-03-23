<script setup>
import * as stat from "@/utils/stat.js";
import {useRoute, useRouter} from "vue-router";
import {useDialog, useMessage} from "naive-ui";
import {Delete} from "@vicons/carbon";

const store = stat.getStore()
const jobs = stat.getJobs()
const jobGroups = stat.getJobGroups()
const props = stat.getPropNames()
const calcStats = stat.getCalcStats()
const route = useRoute()
const router = useRouter()
const message = useMessage()
const dialog = useDialog();

const buffs = ref(stat.getBuffs())
let stopSw = null
let index = ref(null),stats = ref(null),showName = ref(null),calcSource = ref(null)
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
const statNames = ['hp','str','int','luk','dex']
const statRNames = statNames.map(n=>n+'R')
parseIndex()
const gis = "xs:24 s:12 m:8 l:6 xl:4 xxl:4"
// const calcStatsOptions = Object.keys(calcStats).map(k=>{return {label:props[k],value:k}})
const calcStatsOptions = computed(()=>{
  const result = []
  Object.keys(calcStats).forEach(k=>{
    const option = {label:props[k],value:k}
    if (statNames.indexOf(k)>=0){
      if (statIsShow(k)) result.push(option)
    }else if (statRNames.indexOf(k)>=0){
      if (statIsShow(k.substring(0,k.length-1))) result.push(option)
    }else {
      result.push(option)
    }
  })
  return result
})
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
  currentStep.value = 1
  showCalcStatModal.value = true
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
  return `${props[s]}${desc}`
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

const hyperStateLogs = ref(""),calcHyperIng = ref(false)
const hyperPlans = [
  {
    label:"打王",
    value:0,
  },
  {
    label:"練功",
    value:1,
  },
]
const hyperPlan = ref(0)
const currentHyperLevel = ref({
  strD:0,
  dexD:0,
  intD:0,
  lukD:0,
  hpR:0,
  cdR:0,
  imdR:0,
  damR:0,
  bdR:0,
  pmad:0,
  ndR:0,
})
const currentHyperPoint = ref(0)
const calcHyperLevel = ref({})
for (const name of Object.keys(currentHyperLevel.value)){
  calcHyperLevel.value[name] = 0
}
function calcHyperState() {
  const needPoints = [0 ,1, 2, 4, 8, 10, 15, 20, 25, 30, 35, 50, 65, 80, 95, 110]
  function pointAndVal(name,startLevel,currentLevel){
    //需要的點數
    let point = 0
    //提升的數值
    let val = 0
    for (let i=startLevel+1;i<=currentLevel;i++){
      point += needPoints[i]
      switch (name) {
        case "strD":
        case "intD":
        case "lukD":
        case "dexD":
          val += 30
          break
        case "cdR":
          val += 1
          break
        case "damR":
        case "pmad":
          val += 3
          break
        case "bdR":
        case "ndR":
          val += i <= 5 ? 3 : 4
          break
        case "hpR":
          val += 2
          break
      }
    }
    if (name==='imdR'){
      val = currentLevel * 3
    }
    return {
      point,
      val
    }
  }
  calcHyperIng.value = true
  hyperStateLogs.value = ""
  //用於比較的屬性，初始是當前屬性
  let lastStat = stats.value.addStat(stats.value.data,"")
  if (lastStat.level < 140){
    hyperStateLogs.value += "等級不足140無法計算"
    calcHyperIng.value = false
    return
  }
  if (!jobs.hasOwnProperty(lastStat.job)){
    hyperStateLogs.value += "無職業無法計算"
    calcHyperIng.value = false
    return
  }
  //屬性點數
  let hyperPoint = currentHyperPoint.value
  //扣除舊屬性，返還SP
  for (const name of Object.keys(currentHyperLevel.value)){
    const {point,val} = pointAndVal(name,0,currentHyperLevel.value[name])
    hyperPoint += point
    stats.value.addStat(lastStat,name,-val,false)
    calcHyperLevel.value[name] = 0
  }
  // console.log(lastStat)

  const initialImdR = lastStat.imdR
  // for (let i=140;i<=lastStat.level;i++){
  //   hyperPoint += Math.floor(3 + (i-140)/10)
  // }
  hyperStateLogs.value += `超級屬性點總計${hyperPoint}\n`
  hyperStateLogs.value +=` \n---提升順序---\n`
  //升級會帶來打王提升的超級屬性
  // const pss = []
  // for (const ps of jobs[lastStat.job].ps){
  //   pss.push(ps)
  // }
  // for (const ss of jobs[lastStat.job].ss){
  //   pss.push(ss)
  // }

  let lastResult = stats.value.calcNewData(lastStat,hyperPlan.value===0)
  let lastImdR = initialImdR
  for (;;){
    let bestResult = lastResult
    let bestCostP = 0
    let bestName = ""
    let bestLevel = 0
    let bestPoint = 0
    let bestStat = lastStat
    let bestDiff = 0
    for (const name of Object.keys(calcHyperLevel.value)){
      if (hyperPlan.value===0 ){
        if (name==='ndR') continue
      }else {
        if (name==='bdR') continue
        if (name==='imdR') continue
      }
      // if (pss.indexOf(name) === -1) continue
      let nextLevel = calcHyperLevel.value[name]+1
      if (name==='imdR') nextLevel = 15
      for (let level=calcHyperLevel.value[name]+1;level<=nextLevel;level++){
        //需要的點數
        //提升的數值
        let {point,val} = pointAndVal(name,calcHyperLevel.value[name],level)
        if (hyperPoint < point) continue
        lastStat.imdR = name==='imdR' ? initialImdR : lastImdR
        const newStat = stats.value.addStat(lastStat,name==='ndR'?'damR':name,val)
        const addResult = stats.value.calcNewData(newStat,hyperPlan.value===0)
        const diff = addResult.defBossCriticalDamage - lastResult.defBossCriticalDamage
        const costP = diff / point
        // console.log('continue',name,level,hyperPoint,point,diff,addResult.defBossCriticalDamage,lastResult.defBossCriticalDamage)
        if (costP > bestCostP){
          bestCostP = costP
          bestName = name
          bestLevel = level
          bestPoint = point
          bestStat = newStat
          bestDiff = diff
          bestResult = addResult
        }
      }
    }
    if (bestCostP === 0) break
    hyperPoint -= bestPoint
    hyperStateLogs.value += `提升${props[bestName].replace('最終','')}至${bestLevel}等，提升防後b攻${bestDiff}，花費${bestPoint}點，性價比${Math.round(bestCostP)}，剩餘點數${hyperPoint}\n`
    if (bestName==='imdR') lastImdR = bestStat.imdR
    lastStat = bestStat
    lastResult = bestResult
    calcHyperLevel.value[bestName] = bestLevel
  }
  hyperStateLogs.value +=` \n---最終結果---\n`
  Object.keys(calcHyperLevel.value).forEach(name=>{
    hyperStateLogs.value +=`${props[name].replace('最終','')} ${calcHyperLevel.value[name]} 等\n`
  })
  hyperStateLogs.value +=`剩餘點數 ${hyperPoint} 點\n`

  calcHyperIng.value = false
}

const hexaStateLogs = ref(""),calcHexaIng = ref(false)
const hexaTypesOption = [
  {label:props["cdR"],value:"cdR"},
  {label:props["bdR"],value:"bdR"},
  {label:props["imdR"],value:"imdR"},
  {label:props["damR"],value:"damR"},
  {label:props["pmad"],value:"pmad"},
  {label:props["hexaStat"],value:"hexaStat"},
]
const hexaData = ref({
  primary:{
    level:0,
    name:"",
    label:"主要屬性",
  },
  secondary1:{
    level:0,
    name:"",
    label:"次要屬性1",
  },
  secondary2:{
    level:0,
    name:"",
    label:"次要屬性2",
  },
})
function calcHexaState() {
  calcHexaIng.value = true
  hexaStateLogs.value = ''
  if (!jobs.hasOwnProperty(stats.value.data.job)){
    hexaStateLogs.value += "無職業無法計算"
    calcHexaIng.value = false
    return
  }
  const allLv = hexaData.value.primary.level + hexaData.value.secondary1.level + hexaData.value.secondary2.level
  if (allLv < 1){
    hexaStateLogs.value += "HEXA屬性核心總等級小於1無法計算"
    calcHexaIng.value = false
    return
  }
  if (allLv < 2){
    hexaStateLogs.value += "HEXA屬性核心總等級大於20，是否填寫錯誤？"
    calcHexaIng.value = false
    return
  }
  const sourceStat = stats.value.hexaStat(stats.value.data,hexaData.value,false)
  const sourceResult = stats.value.calcNewData(sourceStat)
  hexaStateLogs.value += `扣除當前HEXA屬性後的防後爆B攻為${sourceResult.defBossCriticalDamage}`
  hexaStateLogs.value +=` \n---開始計算---\n`
  const cd = {
    primary:{
      level:hexaData.value.primary.level,
      name:"",
    },
    secondary1:{
      level:hexaData.value.secondary1.level,
      name:"",
    },
    secondary2:{
      level:hexaData.value.secondary2.level,
      name:"",
    },
  }
  let bestPn="",bestSn1="",bestSn2="",bestDiff=0,bestBCD=0
  for (const {value:pn} of hexaTypesOption){
    for (const {value:sn1} of hexaTypesOption){
      if (pn===sn1) continue
      for (const {value:sn2} of hexaTypesOption){
        if (pn===sn2 || sn1===sn2) continue
        cd.primary.name = pn
        cd.secondary1.name = sn1
        cd.secondary2.name = sn2
        const ts = stats.value.hexaStat(stats.value.data,cd)
        const tr = stats.value.calcNewData(ts)
        const diff = tr.defBossCriticalDamage - sourceResult.defBossCriticalDamage
        if (diff > bestDiff){
          bestBCD = tr.defBossCriticalDamage
          bestDiff = diff
          bestPn = pn
          bestSn1 = sn1
          bestSn2 = sn2
        }
        hexaStateLogs.value += `主：${props[pn]}(${cd.primary.level}等)，副1：${props[sn1]}(${cd.secondary1.level}等)，副2：${props[sn2]}(${cd.secondary2.level}等)，防後爆B攻為${tr.defBossCriticalDamage}，提升${diff}\n`
      }
    }
  }

  hexaStateLogs.value +=` \n---最終結果---\n`
  hexaStateLogs.value += `提升最大的組合為：主：${props[bestPn]}(${cd.primary.level}等)，副1：${props[bestSn1]}(${cd.secondary1.level}等)，副2：${props[bestSn2]}(${cd.secondary2.level}等)，防後爆B攻為${bestBCD}，提升${bestDiff}\n`
  calcHexaIng.value = false
}

const showCalcStatModal = ref(false)
// const calcStatType = ref("str")
const currentStep = ref(1);
const calcStatTempData = ref({
  strA:0,
  dexA:0,
  intA:0,
  lukA:0,
  hpA:0,
  incstr:0,
  incdex:0,
  incint:0,
  incluk:0,
  inchp:0,
})
const calcStatResult = computed(()=>{
  const result = {
    strT:'',
    dexT:'',
    intT:'',
    lukT:'',
    hpT:'',
    strC:false,
    dexC:false,
    intC:false,
    lukC:false,
    hpC:false,
    strV:0,
    dexV:0,
    intV:0,
    lukV:0,
    hpV:0,
  }
  for (const t of statNames){
    if (!statIsShow(t)) continue
    result[t+'C'] = false
    result[t+'T'] = ''
    result[t+'V'] = 0
    if (calcStatTempData.value["inc"+t]===0) {
      result[t+'T'] = `吃藥增加的屬性為0，無法計算${props[t]}%數，不更新。`
      continue
    }
    const add = calcStatTempData.value[t+"A"] - stats.value.data[t]
    if (add===0) {
      result[t+'T'] = `吃藥前後屬性相同，無法計算${props[t]}%數，不更新。`
      continue
    }
    switch (t) {
      case "str":
      case "int":
      case "luk":
      case "dex":
        result[t+'V'] = Math.ceil((add / calcStatTempData.value["inc"+t] - 1) * 100)
        //四大屬性%=(((吃藥後 - 吃藥前) ÷ 吃藥增加量 - 1) ÷ 100)%
        result[t+'T'] = `${props[t]}%=(((吃藥後 - 吃藥前) ÷ 吃藥增加量 - 1) ÷ 100)%=(((${calcStatTempData.value[t+"A"]} - ${stats.value.data[t]}) ÷ ${calcStatTempData.value["inc"+t]} - 1) ÷ 100)%=${result[t+'V']}%，點擊更新按鈕後將更新。`
        result[t+'C'] = true
        break
      case "hp":
        const chp = add / calcStatTempData.value["inc"+t] * 100
        result[t+'V'] = Math.ceil(((stats.value.data[t] - stats.value.data[t+"D"]) / chp - 1) * 100)
        //hp%=(((吃藥前 - 最終hp) ÷ ((吃藥後 - 吃藥前) ÷ 吃藥增加量% × 100) - 1) × 100)%
        result[t+'T'] = `${props[t]}%=(((吃藥前 - 最終hp) ÷ ((吃藥後 - 吃藥前) ÷ 吃藥增加量% × 100) - 1) × 100)% = (((${stats.value.data[t]} - ${stats.value.data[t+"D"]}) ÷ ((${calcStatTempData.value[t+"A"]} - ${stats.value.data[t]}) ÷ ${calcStatTempData.value["inc"+t]}% × 100) - 1) × 100)%=${result[t+'V']}%，點擊更新按鈕後將更新。\``
        result[t+'C'] = true
        break
    }
  }

  return result
})
function updateCalcStatResult(){
  const result = calcStatResult.value
  for(const t of statNames){
    if (result[t+'C']) stats.value.data[t+'R'] = result[t+'V']
  }
  showCalcStatModal.value = false
}

const addBuff = ref({
  key:"pmad",
  val:1,
  name:"",
})

const inputPanelCollapseExpanded = ref(['1', '2', '3', '4'])
const buffsPanelCollapseExpanded = ref(['1', '2'])
const resultPanelCollapseExpanded = ref(['1', '2'])
</script>

<template>
  <n-page-header :title="showName.value" @back="handleBack">
    <n-card>
      <n-tabs default-value="input" size="large" justify-content="space-evenly">
        <n-tab-pane name="input" tab="屬性設定">
          <n-form>
            <n-collapse v-model:expanded-names="inputPanelCollapseExpanded">
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
                      <n-popover trigger="hover">
                        <template #trigger>
                          <n-input-number min="0" v-model:value="stats.data.pmad">
                          </n-input-number>
                        </template>
                        <span>填入未受%加成的{{props.pmadR}}，<br>可以由ui數值÷%得到，<br>也可以由滑鼠放上去後條目累加得到</span>
                      </n-popover>
                    </n-form-item-gi>
                    <n-form-item-gi :label="props.pmadR" :span="gis">
                      <n-popover trigger="hover">
                        <template #trigger>
                          <n-input-number min="0" v-model:value="stats.data.pmadR">
                            <template #suffix>
                              %
                            </template>
                          </n-input-number>
                        </template>
                        <span>填入{{props.pmadR}}總和，<br>滑鼠放上{{props.pmadR}}後，<br>在展開的ui中可以看到</span>
                      </n-popover>
                    </n-form-item-gi>
                    <n-form-item-gi :label="props.pmadD" :span="gis">
                      <n-popover trigger="hover">
                        <template #trigger>
                          <n-input-number min="0" v-model:value="stats.data.pmadD">
                          </n-input-number>
                        </template>
                        <span>填入不受%加成的{{props.pmadR}}，<br>目前只有陰陽師HP轉換等少數{{props.pmadR}}不受%加成，一般職業填0即可</span>
                      </n-popover>
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
                    <template v-for="(item, index) in stats.data.imdR">
                      <n-form-item-gi :label="`${props.imdR}${index + 1}`" :span="gis">
                        <n-input-group>
                          <n-input-number min="0" max="100" v-model:value="stats.data.imdR[index]">
                            <template #suffix>
                              %
                            </template>
                          </n-input-number>
                          <n-button style="margin-left: 12px" @click="stats.data.imdR.splice(index, 1)">
                            <template #icon>
                              <n-icon>
                                <Delete />
                              </n-icon>
                            </template>
                          </n-button>
                        </n-input-group>
                      </n-form-item-gi>
                    </template>
                  </n-grid>
                </n-space>
                <template #header-extra>
                  {{stats.calcData().value.imdr}}%
                </template>
              </n-collapse-item>
              <n-collapse-item title="主副屬" name="4">
                <n-space vertical>
                  <n-alert :show-icon="false">
                    每種屬性欄，左側填入ui上現在顯示的屬性右側填入ARC、AUT、極限屬性、聯盟角色卡、內潛、HEXA屬性相加的結果（惡復不加極限屬性）
                  </n-alert>
                  <n-button @click="calcSP(s)">
                    計算屬性%
                  </n-button>
                  <n-grid item-responsive responsive="screen">
                    <template v-for="s in statNames">
                      <n-form-item-gi :label="statLabel(s)" span="xs:24 s:24 m:24 l:12 xl:12 xxl:12" v-if="statIsShow(s)">
                        <n-input-group>
                          <n-popover trigger="hover">
                            <template #trigger>
                              <n-input-number v-model:value="stats.data[s]" />
                            </template>
                            <span>填入ui上顯示的{{props[s]}}</span>
                          </n-popover>
                          <n-popover trigger="hover">
                            <template #trigger>
                              <n-input-number v-model:value="stats.data[s+'D']" />
                            </template>
                            <span>填入不受%加成的{{props[s]}}，<br>來源有ARC、AUT、極限屬性、聯盟角色卡、內潛、HEXA屬性等<br>（惡復極限屬性受%加成）</span>
                          </n-popover>
                          <n-popover trigger="hover">
                            <template #trigger>
                              <n-input-number v-model:value="stats.data[s+'R']" :placeholder="props[s+'R']">
                                <template #suffix>
                                  %
                                </template>
                              </n-input-number>
                            </template>
                            <span>填入{{props[s+'R']}}總和，也可以填入前面數值後按重算%按鈕自動重算</span>
                          </n-popover>
                        </n-input-group>
                      </n-form-item-gi>
                    </template>
                  </n-grid>
                </n-space>
              </n-collapse-item>
            </n-collapse>
          </n-form>
        </n-tab-pane>
        <n-tab-pane name="buffs" tab="BUFF">
          <n-space vertical>
            <n-alert :show-icon="false">
              BUFF板塊內容作用及使用方法：<br>
              有很多人希望可以分別計算不吃BUFF和吃BUFF時的素質，由於直接在屬性設定板塊中填寫吃BUFF後的素質較為繁瑣，且更新素質較為麻煩，所以製作BUFF板塊。<br>
              有了獨立的BUFF板塊後，在屬性設定板塊板塊中只需要填寫乾淨素質，在BUFF板塊勾選需要應用的BUFF，在計算結果板塊中查看的即是應用完BUFF之後的素質。<br>
              如果常用BUFF列表無法滿足，還可以自定BUFF。<br>
              註：楓祝增加的是按手動增加到屬性值上的屬性點（ui中屬性括號內、加號左側數值減去初始值4，e.g:1000(900+100)，則手動增加的屬性值為900-4=896）增加屬性，一般職業4轉後計算公式可以視為(14+5×等級)*15%/16%捨去小數（你的楓祝加成或許是{{Math.floor((14+5*stats.data.level)*0.15)}}/{{Math.floor((14+5*stats.data.level)*0.16)}}）
            </n-alert>
            <n-collapse v-model:expanded-names="buffsPanelCollapseExpanded">
              <n-collapse-item title="常用BUFF" name="1">
                <n-space vertical>
                  <template v-for="buff in buffs.default">
                    <n-checkbox
                        v-model:checked="buff.check"
                        :label="buff.desc"
                    />
                  </template>
                </n-space>
              </n-collapse-item>
              <n-collapse-item title="自定BUFF" name="2">
                <n-space vertical>
                  <n-input-group>
                    <n-input-number v-model:value="addBuff.val">
                      <template v-if="addBuff.key.charAt(addBuff.key.length-1)==='R'" #suffix>
                        %
                      </template>
                    </n-input-number>
                    <n-select
                        v-model:value="addBuff.key"
                        placeholder="請選擇BUFF能力"s
                        :options="calcStatsOptions"
                    />
                  </n-input-group>
                  <n-input-group>
                    <n-input v-model:value="addBuff.name" placeholder="請輸入BUFF名稱">
                    </n-input>
                    <n-button @click="buffs.add(addBuff.name,addBuff.key,addBuff.val)">添加</n-button>
                  </n-input-group>
                  <template v-for="(buff,index) in buffs.custom">
                    <n-space item-style="display: flex;" align="center">
                      <n-checkbox
                          v-model:checked="buff.check"
                          :label="buff.desc"
                      />
                      <n-button size="small" @click="buffs.del(index)">刪除</n-button>
                    </n-space>
                  </template>
                </n-space>
              </n-collapse-item>
            </n-collapse>
          </n-space>
        </n-tab-pane>
        <n-tab-pane name="result" tab="計算結果">
          <n-form>
            <n-collapse v-model:expanded-names="resultPanelCollapseExpanded">
              <n-collapse-item title="素質" name="1">
                <n-grid item-responsive responsive="screen">
                  <n-gi :span="gis">
                    <n-popover trigger="hover">
                      <template #trigger>
                        表攻：{{numberFormat(stats.calcData().value.dDamage)}}
                      </template>
                      <span>真攻 × (100% + 傷害%) × (100% + 總傷%)</span>
                    </n-popover>
                  </n-gi>
                  <n-gi :span="gis">
                    <n-popover trigger="hover">
                      <template #trigger>
                        真攻：{{numberFormat(stats.calcData().value.damage)}}
                      </template>
                      <span>武器係數({{stats.data.job===null?'-':jobs[stats.data.job].wm}}) × 屬性加權({{stats.calcData().value.st}}) × 總攻擊力({{Math.floor(stats.data.pmad * (1+stats.data.pmadR/100))}}) ÷ 100</span>
                    </n-popover>
                  </n-gi>
                  <n-gi :span="gis">
                    <n-popover trigger="hover">
                      <template #trigger>
                        B攻：{{numberFormat(stats.calcData().value.bDamage)}}
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
                        防後B攻：{{numberFormat(stats.calcData().value.defBDamage)}}
                      </template>
                      <span>無視：{{stats.calcData().value.imdr.toFixed(2)}}%，剩餘防禦：{{(100 - stats.calcData().value.remainingDef * 100).toFixed(2)}}%<br />B攻 × (100% - 剩餘防禦%)</span>
                    </n-popover>
                  </n-gi>
                  <n-gi :span="gis">
                    <n-popover trigger="hover">
                      <template #trigger>
                        防後暴B攻：{{numberFormat(stats.calcData().value.defBossCriticalDamage)}}
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

                    <n-gi :span="gis">
                      <n-popover trigger="hover">
                        <template #trigger>防後爆B攻：{{stats.calcSourceResult().value.diff}}</template>
                        <span>提升{{calcSource.val}}{{calcSource.name.charAt(calcSource.name.length-1)==='R'?'%':''}}{{props[calcSource.name]}}後增加的防後爆B攻</span>
                      </n-popover>
                    </n-gi>
                    <n-gi :span="gis">
                      <n-popover trigger="hover">
                        <template #trigger>表攻：{{stats.calcSourceResult().value.dDamage}}</template>
                        <span>提升{{calcSource.val}}{{calcSource.name.charAt(calcSource.name.length-1)==='R'?'%':''}}{{props[calcSource.name]}}後增加的表攻</span>
                      </n-popover>
                    </n-gi>
                    <template  v-for="s in statNames">
                      <template v-if="statIsShow(s)">
                        <n-gi :span="gis">{{props[s]}}：{{stats.calcSourceResult().value[s]}}</n-gi>
                        <n-gi :span="gis">{{props[s+'R']}}：{{stats.calcSourceResult().value[s+'R']}}%</n-gi>
                        <n-gi :span="gis">{{props[s+'D']}}：{{stats.calcSourceResult().value[s+'D']}}</n-gi>
                      </template>
                    </template>
                    <n-gi :span="gis">{{props.atR}}：{{stats.calcSourceResult().value.atR}}%</n-gi>
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
              <n-collapse-item title="超級屬性" name="3">
                <n-space vertical>
                  <n-alert :show-icon="false">
                    計算超級屬性時建議先將暴擊率點到100%。<br>
                    注意計算結果受“素質”ui中的目標防禦%影響<br>
                    設置當前Lv後，在計算時將會自動扣除當前Lv增加的素質並返還使用的SP，所以剩餘SP僅需要填寫當前ui中顯示的剩餘SP即可。
                  </n-alert>
                  <template v-for="name of Object.keys(currentHyperLevel)">
                    <n-form-item label-placement="left" :label="'當前'+props[name].replace('最終','')+'.Lv:'">
                      <n-input-number min="0" max="15" v-model:value="currentHyperLevel[name]" />
                    </n-form-item>
                  </template>
                  <n-space>
                    <n-button :loading="calcHyperIng" @click="calcHyperState">
                      點我開始計算
                    </n-button>
                    <n-radio-group v-model:value="hyperPlan" name="radiobuttongroup1">
                      <n-radio-button
                          v-for="plan in hyperPlans"
                          :key="plan.value"
                          :value="plan.value"
                          :label="plan.label"
                      />
                    </n-radio-group>
                    <n-form-item label-placement="left" label="剩餘SP：">
                      <n-input-number placeholder="" v-model:value="currentHyperPoint" />
                    </n-form-item>
                  </n-space>
                  <n-log :log="hyperStateLogs"/>
                </n-space>
              </n-collapse-item>
              <n-collapse-item title="HEXA屬性" name="4">
                <n-space vertical>
                  <template v-for="item of hexaData">
                    <n-form-item label-placement="left" :label="item.label">
                      <n-input-group>
                        <n-popover trigger="hover">
                          <template #trigger>
                            <n-input-number min="0" max="10" v-model:value="item.level" />
                          </template>
                          <span>填入{{item.label}}的等級</span>
                        </n-popover>
                        <n-popover trigger="hover">
                          <template #trigger>
                            <n-select v-model:value="item.name" :options="hexaTypesOption" />
                          </template>
                          <span>選擇{{item.label}}的類別</span>
                        </n-popover>
                      </n-input-group>
                    </n-form-item>
                  </template>

                  <n-button :loading="calcHexaIng" @click="calcHexaState">
                    點我開始計算
                  </n-button>
                  <n-log :log="hexaStateLogs"/>
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
  <n-modal
      v-model:show="showCalcStatModal"
      :mask-closable="false"
  >
    <n-card
        :bordered="false"
        size="huge"
        role="dialog"
        aria-modal="true"
        style="width: 100%; max-width: calc(100vw - 32px);"
    >
      <n-form>
        <n-space vertical>
          <n-steps size="small" :current="currentStep">
            <n-step title="填寫屬性" />
            <n-step title="吃藥" />
            <n-step title="填寫屬性" />
            <n-step title="計算結果" />
          </n-steps>
          <n-space vertical v-show="currentStep===1">
            <n-alert :show-icon="false">
              填寫現在的ui上顯示的屬性值
            </n-alert>
            <template v-for="s in statNames">
              <n-form-item :label="statLabel(s)" span="24" v-if="statIsShow(s)">
                <n-input-number v-model:value="stats.data[s]" />
              </n-form-item>
            </template>
          </n-space>
          <n-space vertical v-show="currentStep===2">
            <n-alert :show-icon="false">
              請在遊戲內吃藥（推薦拍賣拉最上級祝福秘藥、傳說中的祝福秘藥等全屬性增加固定數值的秘藥）或穿/脫塔戒，並填寫增加的原始屬性值（e.g:脫下塔戒，則填寫“-4”），惡復使用三轉技能“急速療癒”或五轉技能“聖火”，填寫數值一般為25%或40%
            </n-alert>
            <template v-for="s in statNames">
              <n-form-item :label="statLabel(s)+'應增加'" span="24" v-if="statIsShow(s)">
                <n-input-number v-model:value="calcStatTempData['inc'+s]">
                  <template v-if="s==='hp'" #suffix>
                    %
                  </template>
                </n-input-number>
              </n-form-item>
            </template>
          </n-space>
          <n-space vertical v-show="currentStep===3">
            <n-alert :show-icon="false">
              填寫現在的ui上顯示的屬性值
            </n-alert>
            <template v-for="s in statNames">
              <n-form-item :label="statLabel(s)" span="24" v-if="statIsShow(s)">
                <n-input-number v-model:value="calcStatTempData[s+'A']" />
              </n-form-item>
            </template>
          </n-space>
          <n-space vertical v-show="currentStep===4">
            <n-alert :show-icon="false">
              <template v-for="s in statNames">
                <template v-if="statIsShow(s)">
                  {{calcStatResult[s+'T']}}<br>
                </template>
              </template>
            </n-alert>
            <n-space justify="center">
              <n-button @click="updateCalcStatResult" type="success">
                更新
              </n-button>
            </n-space>
          </n-space>
        </n-space>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="()=>{if(currentStep > 1) currentStep -= 1}" :disabled="currentStep <= 1" round>
            上一步
          </n-button>
          <n-button @click="()=>{if(currentStep < 4) currentStep += 1}" :disabled="currentStep >= 4" round>
            下一步
          </n-button>
          <n-button @click="showCalcStatModal = false">
            取消
          </n-button>
        </n-space>
      </template>
    </n-card>
  </n-modal>
</template>

<style scoped>

</style>