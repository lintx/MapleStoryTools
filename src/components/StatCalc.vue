<script setup>
import * as stat from "@/utils/stat.js";
import {useRoute, useRouter} from "vue-router";
import {useDialog, useMessage} from "naive-ui";
import {Delete} from "@vicons/carbon";
import {formatFloat} from "../utils/stat.js";

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
let index = ref(null),stats = ref(null),showName = ref(null),calcSources = ref(null)
function parseIndex(){
  stopSw !== null && stopSw
  index.value = parseInt(route.params.index)
  if (isNaN(index.value) || index.value < 0 || index.value >= store.stats().length){
    message.error("無效的檔案");
    router.push(`/stat-calc`)
    index.value = store.stats()[store.stats().length-1]
  }
  stats.value = store.stats()[index.value]
  calcSources.value = stats.value.calcSources
  // console.log(stats)
  showName.value = stats.value.showName()
  stopSw = watch(()=>[stats.value.data,stats.value.name],()=>{
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
const statDNames = statNames.map(n=>n+'D')
parseIndex()
const gis = "xs:24 s:12 m:8 l:6 xl:4 xxl:4"
// const calcStatsOptions = Object.keys(calcStats).map(k=>{return {label:props[k],value:k}})
const calcStatsOptions = computed(()=>{
  const result = []
  Object.keys(calcStats).forEach(k=>{
    const option = {label:props[k],value:k}
    if (statNames.indexOf(k)>=0){
      if (statIsShow(k)) result.push(option)
    }else if (statRNames.indexOf(k)>=0 || statDNames.indexOf(k)>=0){
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
function numToRate(num){
  let p = 1_00
  num *= p * 100
  while(num < 10){
    p *= 10
    num *= 10
  }
  return (Math.round(num) / p).toFixed(p.toFixed().length-1) + '%'
}
function calcHyperState() {
  const needPoints = [0 ,1, 2, 4, 8, 10, 15, 20, 25, 30, 35, 50, 65, 80, 95, 110]
  //計算極限屬性從某個等級到某個等級所需要的點數和增加的屬性
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

  /**
   * 生成所有可能的屬性提升方案
   * @param names 所有屬性
   * @param index 現在計算的屬性索引
   * @param max 現在計算的屬性最大等級
   * @param temp 現在計算的屬性提升方案
   * @param result 所有可能的屬性提升方案集合
   * @param point 剩餘屬性點數
   */
  function generatePlans(names,index,max,temp,result,point){
    if(index===names.length){
      for(const name in temp){
        if(temp[name] < max && point >= needPoints[temp[name]+1]) return
      }
      temp.point = point
      result.push(temp)
      return
    }
    let _point = point
    for(let i=temp[names[index]];i<=max;i++){
      if(i!==temp[names[index]]) {
        _point -= needPoints[i]
        if (_point < 0){
          return
        }
      }
      const copy = Object.assign({},temp)
      copy[names[index]] = i
      generatePlans(names,index+1,max,copy,result,_point)
    }
  }
  calcHyperIng.value = true //正在計算
  hyperStateLogs.value = "" //清空日誌
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
  //算出初始素質
  const initialResult = stats.value.calcNewData(lastStat)
  //屬性點數
  let hyperPoint = currentHyperPoint.value
  //當前職業主副屬
  const pss = []
  for (const ps of jobs[lastStat.job].ps){
    pss.push(ps==='hp'?'hpR':ps+'D')
  }
  for (const ss of jobs[lastStat.job].ss){
    pss.push(ss==='hp'?'hpR':ss+'D')
  }
  //扣除舊屬性，返還SP
  let tempPlan = {}
  for (const name of Object.keys(currentHyperLevel.value)){
    const {point,val} = pointAndVal(name,0,currentHyperLevel.value[name])
    // console.log(props[name]+currentHyperLevel.value[name]+',返還點數' + point + ",屬性" + val)
    hyperPoint += point
    stats.value.addStat(lastStat,name,-val,false)
    calcHyperLevel.value[name] = 0

    //只從有提升的屬性中計算
    if (hyperPlan.value===0 ){
      if (name==='ndR') continue
    }else {
      if (name==='bdR') continue
      if (name==='imdR') continue
    }
    if (['hpR','strD','intD','lukD','dexD'].indexOf(name) >= 0 && pss.indexOf(name)===-1) continue
    tempPlan[name] = 0
  }
  // console.log(lastStat)

  const initialImdR = lastStat.imdR
  hyperStateLogs.value += `超級屬性點總計${hyperPoint}\n`
  // hyperStateLogs.value +=` \n---提升順序---\n`

  //用於比較的面板
  let lastResult = stats.value.calcNewData(lastStat)
  // console.log(lastResult.imdr)
  let lastImdR = initialImdR
  const planNames = Object.keys(tempPlan) //屬性名
  let minPoint = Math.ceil(hyperPoint/3) //剩餘1/3點數時即終止性價比計算，改為所有組合的遍歷計算
  for (;;){
    //性價比計算法，前2/3點數按性價比進行計算
    let bestResult = lastResult //當前最好的結果
    let bestCostP = 0 //最高性價比
    let bestName = "" //最高性價比屬性
    let bestLevel = 0 //最高性價比屬性等級
    let bestPoint = 0 //最高性價比屬性需要的點數
    let bestStat = lastStat //當前最好的結果的屬性
    let bestDiff = 0
    for (const name of planNames){
      //計算每種屬性提升到下一個等級的性價比（無視防禦每次都計算到最高等）
      let nextLevel = tempPlan[name]+1
      if (name==='imdR') nextLevel = 15
      for (let level=tempPlan[name]+1;level<=nextLevel;level++){
        //需要的點數
        //提升的數值
        let {point,val} = pointAndVal(name,tempPlan[name],level)
        if (hyperPoint < point) continue
        //如果計算的是無視防禦，則在初始無視的基礎上加算，否則使用最後計算時的無視，這是因為無視作為整體數據不能拆分加算
        lastStat.imdR = name==='imdR' ? initialImdR : lastImdR
        //加上本次加點的屬性
        const newStat = stats.value.addStat(lastStat,name,val)
        //計算加點後的素質
        const addResult = stats.value.calcNewData(newStat)
        //計算加點後增加的素質
        const diff = hyperPlan.value===0 ? addResult.defBossCriticalDamage - lastResult.defBossCriticalDamage : addResult.nDamage - lastResult.nDamage
        //計算性價比
        const costP = diff / point
        // console.log('continue',props[name],name,level,hyperPoint,point,diff,addResult.defBossCriticalDamage,lastResult.defBossCriticalDamage)
        //性價比更好的話，就暫時保留本次加點的結果
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
    //如果最佳性價比等於0，則表示沒有任何提升
    if (bestCostP === 0) break
    //扣除加點的點數
    hyperPoint -= bestPoint
    // hyperStateLogs.value += `提升${props[bestName].replace('最終','')}至${bestLevel}等，提升防後b攻${bestDiff}，花費${bestPoint}點，性價比${Math.round(bestCostP)}，剩餘點數${hyperPoint}\n`
    //緩存本次加點的無視
    if (bestName==='imdR') lastImdR = bestStat.imdR
    lastStat = bestStat //緩存本次加點的屬性
    lastResult = bestResult //緩存本次加點的素質結果
    tempPlan[bestName] = bestLevel  //進行加點
    if (hyperPoint <= minPoint) break //剩餘點數低於保留點數時終止性價比算法，轉為貪心算法
  }

  const allPlans = []
  //生成所有可能的方案
  generatePlans(planNames,0,15,tempPlan,allPlans,hyperPoint);
  // let testPlan = {
  //   intD:5,
  //   lukD:4,
  //   cdR:12,
  //   imdR:12,
  //   damR:13,
  //   bdR:14,
  //   pmad:7,
  //   point:2,
  // }
  // allPlans.push(testPlan);
  (()=>{
    let bestStat = lastStat //最好的屬性
    let bestResult = lastResult //最高傷害
    let bestPlan = tempPlan //最好的方案
    for (const plan of allPlans){
      //複製一份屬性
      let newStat = stats.value.addStat(lastStat,"")
      newStat.imdR = initialImdR  //更換為初始無視，因為無視需要整體運算
      for (const name in plan){
        if (name !== "point"){
          let {val} = pointAndVal(name,tempPlan[name],plan[name]) //算出增加的屬性值
          newStat = stats.value.addStat(newStat,name,val,name==='imdR') //算出增加後的屬性，如果是無視時則使用複製模式，否則直接增加
        }
      }
      const newResult = stats.value.calcNewData(newStat)  //算出新的素質
      // if (plan===testPlan){
      //   console.log("testPlan:" + newResult.defBossCriticalDamage)
      // }
      //比對新的素質結果
      const diff = hyperPlan.value===0 ? newResult.defBossCriticalDamage - bestResult.defBossCriticalDamage : newResult.nDamage - bestResult.nDamage
      if (diff > 0){
        bestStat = newStat
        bestResult = newResult
        bestPlan = plan
      }
    }
    tempPlan = bestPlan
    lastResult = bestResult
    lastStat = bestStat
  })()

  hyperStateLogs.value +=` \n---最終結果---\n`
  planNames.forEach(name=>{
    hyperStateLogs.value +=`${props[name].replace('最終','')} ${tempPlan[name]} 等\n`
    calcHyperLevel.value[name] = tempPlan[name]
  })

  hyperStateLogs.value +=`剩餘點數 ${tempPlan.point} 點\n`
  // console.log(lastStat,lastResult)
  if (hyperPlan.value===0){
    hyperStateLogs.value +=`防後爆B攻 ${numberFormat.value(lastResult.defBossCriticalDamage)}\n`
  }else {
    hyperStateLogs.value +=`一般攻 ${numberFormat.value(lastResult.nDamage)}\n`
  }
  let diff = lastResult.defBossCriticalDamage - initialResult.defBossCriticalDamage
  if (diff > 0){
    //提升
    hyperStateLogs.value +=`相較於現在的方案，新方案提升了${numToRate(diff / lastResult.defBossCriticalDamage)}\n`
  }else if (diff === 0){
    //無提升
    hyperStateLogs.value +=`你現在的方案已經是最佳方案了。\n`
  }else {
    //下降
    hyperStateLogs.value +=`你現在的方案比計算機計算的方案更好，這說明計算機的算法有待改進，如果可以的話，是否可以前往github或巴哈將您的數據反饋給作者以便改進？\n`
  }

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

const addBuff = ref({
  key:"pmad",
  val:1,
  name:"",
})

const inputPanelCollapseExpanded = ref(['1', '2', '3', '4'])
const buffsPanelCollapseExpanded = ref(['1', '2'])
const resultPanelCollapseExpanded = ref(['1', '2'])

const statImdR = computed(()=>{
  let mdr = 100
  for (const v of stats.value.data.imdR){
    mdr *= (100-v)/100
  }
  return 100 - mdr
})
</script>

<template>
  <n-page-header :title="showName.value" @back="handleBack">
    <n-card>
      <n-tabs default-value="input" size="large" justify-content="space-evenly">
        <n-tab-pane name="input" tab="屬性設定">
          <n-form>
            <n-collapse v-model:expanded-names="inputPanelCollapseExpanded">
              <n-collapse-item title="等級、職業" name="1">
                <n-grid item-responsive responsive="screen" x-gap="12">
                  <n-form-item-gi label="備註名" :span="gis">
                    <n-input v-model:value="stats.name" />
                  </n-form-item-gi>
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
                  <n-grid item-responsive responsive="screen" x-gap="12">
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
                    <n-form-item-gi :label="props.pmad+'基本數值'" :span="gis">
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
                    <n-form-item-gi :label="props.pmad+'%未套用數值'" :span="gis">
                      <n-popover trigger="hover">
                        <template #trigger>
                          <n-input-number min="0" v-model:value="stats.data.pmadD">
                          </n-input-number>
                        </template>
                        <span>填入{{props.pmad}}%未套用數值，<br>目前只有陰陽師HP轉換等少數{{props.pmad}}不套用%加成，一般職業填0即可</span>
                      </n-popover>
                    </n-form-item-gi>
                    <n-form-item-gi :label="props.bdR" :span="gis">
                      <n-input-number min="0" v-model:value="stats.data.bdR">
                        <template #suffix>
                          %
                        </template>
                      </n-input-number>
                    </n-form-item-gi>
                    <n-form-item-gi :label="props.ndR" :span="gis">
                      <n-input-number min="0" v-model:value="stats.data.ndR">
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
                  <n-grid item-responsive responsive="screen" x-gap="12">
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
                  {{stat.formatFloat(statImdR)}}%
                </template>
              </n-collapse-item>
              <n-collapse-item title="主副屬" name="4">
                <n-space vertical>
                  <n-grid item-responsive responsive="screen" x-gap="12">
                    <template v-for="s in statNames">
                      <n-form-item-gi :label="statLabel(s) + ' 按順序填入基本數值、%數值、%未套用數值'" span="xs:24 s:24 m:24 l:12 xl:12 xxl:12" v-if="statIsShow(s)">
                        <n-input-group>
                          <n-popover trigger="hover">
                            <template #trigger>
                              <n-input-number v-model:value="stats.data[s]" />
                            </template>
                            <span>填入ui上顯示的{{props[s]}}基本數值</span>
                          </n-popover>
                          <n-popover trigger="hover">
                            <template #trigger>
                              <n-input-number v-model:value="stats.data[s+'R']" :placeholder="props[s+'R']">
                                <template #suffix>
                                  %
                                </template>
                              </n-input-number>
                            </template>
                            <span>填入{{props[s+'R']}}數值</span>
                          </n-popover>
                          <n-popover trigger="hover">
                            <template #trigger>
                              <n-input-number v-model:value="stats.data[s+'D']" />
                            </template>
                            <span>填入{{props[s]}}%未套用數值</span>
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
                <n-grid item-responsive responsive="screen" x-gap="12">
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
                  <n-gi :span="gis">
                    <n-popover trigger="hover">
                      <template #trigger>
                        一般：{{numberFormat(stats.calcData().value.nDamage)}}
                      </template>
                      <span>真攻 × (100% + 傷害% + 一般傷害%) × (100% + 總傷%)</span>
                    </n-popover>
                  </n-gi>
                  <n-gi :span="gis">
                    <n-popover trigger="hover">
                      <template #trigger>
                        無視：{{stat.formatFloat(stats.calcData().value.imdr)}}%
                      </template>
                      <span>計算BUFF後的無視防禦率%</span>
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
                    無視防禦視為增加一條無視而不是直接在當前無視的基礎上增加數值，比如當前無視80%，增加40%無視後，最終無視是88%而不是120%；相應的，等效結果中的無視也是等效源的數值相當於額外增加一條%數的無視的效果；無視的實際效果可能會受不顯示在ui中的無視（如部分5、6轉技能）影響而導致實際提升幅度沒有計算器計算的大，如需計算此部分無視的影響可以在屬性設定ui中增加此部分無視。<br>
                    由於傷害計算部分有大量需要“向下取整”的地方會捨去部分小數，所以有部分數據的換算會有一定誤差，可以調整等效源的數值以多次分析。<br>
                    對於惡復來說，由於計算實際hp時會減半計算，所以如果提升的hp來源為裝備等，需要將等效數值乘以2計算（%數正常計算即可）。
                  </n-alert>
                  <n-grid item-responsive responsive="screen" x-gap="12">
                    <n-form-item-gi span="24">
                      <n-button attr-type="button" @click="calcSources.push({name:'pmad',val:0,})">
                        增加等效源
                      </n-button>
                    </n-form-item-gi>

                    <template v-for="(source, index) in calcSources">
                      <n-form-item-gi :show-label="false" span="24">
                        <n-input-group>
                          <n-input-number v-model:value="source.val">
                            <template v-if="source.name.charAt(source.name.length-1)==='R'" #suffix>
                              %
                            </template>
                          </n-input-number>
                          <n-select
                              v-model:value="source.name"
                              placeholder="請選擇等效源屬"
                              :options="calcStatsOptions"
                          />
                          <n-button style="margin-left: 12px" @click="calcSources.splice(index, 1)">
                            <template #icon>
                              <n-icon>
                                <Delete />
                              </n-icon>
                            </template>
                          </n-button>
                        </n-input-group>
                      </n-form-item-gi>
                    </template>

                    <n-gi :span="gis">
                      <n-popover trigger="hover">
                        <template #trigger>提升防後爆B攻：{{stats.calcSourceResult().value.diff}}</template>
                        <span>提升所有等效屬性後增加的防後爆B攻</span>
                      </n-popover>
                    </n-gi>
                    <n-gi :span="gis">
                      <n-popover trigger="hover">
                        <template #trigger>提升%：{{stats.calcSourceResult().value.diffR}}%</template>
                        <span>提升所有等效屬性後增加的防後爆B攻相對於未提升時的%數</span>
                      </n-popover>
                    </n-gi>
                    <n-gi :span="gis">
                      <n-popover trigger="hover">
                        <template #trigger>表攻：{{stats.calcSourceResult().value.dDamage}}</template>
                        <span>提升所有等效屬性後增加的表攻</span>
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
              <n-collapse-item title="極限屬性" name="3">
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
</template>

<style scoped>

</style>