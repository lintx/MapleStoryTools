<script setup>
import {useRoute, useRouter} from "vue-router";
import {useMessage} from "naive-ui";
import {Delete} from "@vicons/carbon";
import {watch} from "vue"
import {dupeObj, formatFloat, getCalcStats, getJobs, getPropNames, getStore} from "./store.js"
import {debounce} from "@/utils/debounce.js";

const route = useRoute()
const router = useRouter()
const message = useMessage()

const {jobGroups,jobs} = getJobs()
const props = getPropNames()
const calcStats = getCalcStats()
const allStats = getStore().stats
const statsIndex = ref(-1)
const currentStat = computed(() => {
  if (statsIndex.value < 0 || statsIndex.value >= allStats.length){
    return null
  }
  return allStats[statsIndex.value]
})
const currentStatName = computed(()=>{
  if (currentStat.value===null) return ""
  return currentStat.value.showName
})
const mapleBuffStat = computed(() => {
  let baseAddStat = 0
  let ps = ""
  switch (currentStat.value.job) {
    case "3122":
      break
    default:
      ps = jobs[currentStat.value.job].ps
      const psCount = ps.length
      const allStats = (currentStat.value.level-1)*5+25-((4-psCount)*4)+10
      baseAddStat = allStats / psCount
  }

  return {
    ps,
    maple30:Math.floor(baseAddStat * 0.15),
    maple31:Math.floor(baseAddStat * 0.16),
    maple30Super:Math.floor(baseAddStat * 0.15 * 4),
    maple31Super:Math.floor(baseAddStat * 0.16 * 4),
  }
})

function handleBack() {
  router.push(`/stat-calc`)
}
watch(
    ()=>route.params.index,
    () => {
      statsIndex.value = parseInt(route.params.index)
      if (currentStat.value===null){
        message.error("無效的檔案");
        handleBack()
      }
    },
    {immediate:true}
)

function calcSourceData(data){
  data = dupeObj(data)
  const result = {
    st:0,   //加權後屬性
    wm:0,   //武器係數
    imdr:0, //無視
    damage:0,   //真攻
    bDamage:0,  //b功
    nDamage:0,  //b功
    dDamage:0,  //表功
    remainingDef:0, //有效傷害比
    defBDamage:0,   //有效b功
    defBossCriticalDamage:0,    //有效爆功
  }
  if (!jobs.hasOwnProperty(data.job)){
    return result
  }
  applyBuff(data)

  //計算無視
  let mdr = 100
  for (const v of data.imdR){
    mdr *= (100-v)/100
  }
  mdr = Math.max(0,mdr)
  result.imdr = 100 - mdr

  //計算屬性
  switch (data.job) {
    case "3122":
      let chp = 545 + 90 * data.level
      result.st = Math.floor(chp / 3.5) + 0.8 * Math.floor((data.hp * (1+data['hpR']/100) + data.hpD - chp) / 3.5) + data.str * (1+data['strR']/100) + data.strD
      break
    case "3612":
      result.st = (data.str * (1+data['strR']/100) + data.strD + data.luk * (1+data['lukR']/100) + data.lukD + data.dex + (1+data['dexR']/100) + data.dexD) * 3
      break
    default:
      for (const s of jobs[data.job].ps){
        result.st += (data[s] * (1+data[s+'R']/100) + data[s+'D']) * 4
      }
      for (const s of jobs[data.job].ss){
        result.st += data[s] * (1+data[s+'R']/100) + data[s+'D']
      }
  }

  //計算真功
  result.wm = jobs[data.job].wm
  result.damage = Math.floor(result.wm * result.st * Math.floor(data.pmad * (1+data.pmadR/100) + data.pmadD) / 100)

  //表功
  result.dDamage = Math.floor(result.damage * (1+data.damR/100) * (1+data.pmdR/100))

  //練功
  result.nDamage = Math.floor(result.damage * (1+data.damR/100+data.ndR/100) * (1+data.pmdR/100)* ( 1.35 + data.cdR / 100))

  //b功
  result.bDamage = Math.floor(result.damage * (1+data.damR/100+data.bdR/100) * (1+data.pmdR/100))

  //防禦後有效傷害部分
  result.remainingDef = 1 - ( 1 - result.imdr/100) * def.value/100

  //計算防後B功
  result.defBDamage = Math.max(Math.floor(result.bDamage * result.remainingDef),0)

  //計算防後暴B功
  result.defBossCriticalDamage = Math.floor(result.defBDamage * ( 1.35 + data.cdR / 100))

  return result
}
function applyBuff(data){
  // data = dupeObj(data)
  //計算buff
  for (const buff of [...buffs.default,...buffs.custom]){
    if (buff.check){
      for (const ss of buff.stats){
        const keys = ss.getKey()
        for (const key of keys){
          addStat(data,key,ss.getValue(),false)
        }
      }
    }
  }
  return data
}
function addStat(source,name,val,dupe=false){
  const data = dupe ? dupeObj(source) : source
  if (name==="") return data
  switch (name) {
    case "imdR":
      if (val < 0){
        //扣除無視防禦時，應這樣扣除
        //(100-i)/100*(100-y)/100=1,(100-i)*(100-y)=10000,100-y=10000/(100-i),y=100-10000/(100-i)
        let sub = false
        for (let i=0;i<data.imdR.length;i++){
          if (data.imdR[i]===-val){
            data.imdR.splice(i,1)
            sub = true
            break
          }
        }
        if (!sub){
          data[name].push(100-10000/(100+val))
        }
      }else {
        data[name].push(val)
      }
      break
    case "atR":
      for (const san of ['str','int','luk','dex']){
        data[san+'R'] += val
      }
      break
    default:
      if (data.hasOwnProperty(name)) data[name] += val
  }
  return data
}

class BuffStat{
  constructor(key,value){
    this.key = key
    this.value = value
  }

  getKey(){
    let result = this.key
    if (typeof this.key === "function"){
      try {
        result = this.key()
      }catch (e) {
        result = ""
      }
    }
    if (typeof result === "string"){
      result = [result]
    }
    return result
  }

  getValue(){
    if (typeof this.value==="function"){
      try {
        return this.value()
      }catch(e){
        return 0
      }
    }
    return this.value
  }

  getDesc(stat){
    const keys = this.getKey(stat)
    return `${keys.map(k=>props[k]).join(",")}+${this.getValue(stat)}${keys[0].charAt(keys[0].length-1)==='R'?'%':''}`
  }
}

class Buff{
  constructor(name,...stats) {
    this.name = name
    this.stats = stats
    this.check = false
  }
  getDesc(stat){
    return `${this.name}：${this.stats.map(s=>s.getDesc(stat)).join('，')}`
  }
}

class Buffs{
  static localBuffKey = `stat_buff_data`
  load(){
    const local = localStorage.getItem(Buffs.localBuffKey)
    try {
      const j = JSON.parse(local)
      if (Array.isArray(j)){
        for (const i of j){
          if (Array.isArray(i) && i.length===3){
            this.custom.push(new Buff(i[0],new BuffStat(i[1],i[2])))
          }
        }
      }
    }catch (e) {

    }
  }
  constructor() {
    this.save_func = debounce(()=>{
      const arr = []
      for (const s of this.custom){
        arr.push([s.name,s.stats[0].key,s.stats[0].value])
      }
      localStorage.setItem(Buffs.localBuffKey,JSON.stringify(arr))
    })
    this.default = [
      new Buff(`公會BOSS`,new BuffStat("bdR",30)),
      new Buff(`公會無視`,new BuffStat("imdR",30)),
      new Buff(`公會總傷`,new BuffStat("damR",30)),
      new Buff(`公會爆傷`,new BuffStat("cdR",30)),
      new Buff(`公會祝福`,new BuffStat("pmad",20)),
      new Buff(`公會大祝福`,new BuffStat("pmad",30)),
      new Buff(`MVP`,new BuffStat("pmad",30)),
      new Buff(`破王天氣`,new BuffStat("pmad",30)),
      new Buff(`聯盟之力`,new BuffStat("pmad",30)),
      new Buff(`怪公藥水`,new BuffStat("pmad",30)),
      new Buff(`紅色星星`,new BuffStat("bdR",20)),
      new Buff(`藍色星星`,new BuffStat("imdR",20)),
      new Buff(`力量藥水`,new BuffStat("str",30)),
      new Buff(`智力藥水`,new BuffStat("int",30)),
      new Buff(`運氣藥水`,new BuffStat("luk",30)),
      new Buff(`敏捷藥水`,new BuffStat("dex",30)),
      new Buff(`大英雄`,new BuffStat("damR",10)),
      new Buff(`章魚燒炒麵`,new BuffStat("pmad",20)),
      new Buff(`戰鬥機`,new BuffStat("pmad",30)),
      new Buff(`裝備名匠`,new BuffStat("cdR",5)),
      new Buff(`275椅子`,new BuffStat("pmad",50)),
      new Buff(`五轉眼`,new BuffStat("cdR",8)),
      new Buff(`30等弓手眼`,new BuffStat("cdR",15)),
      new Buff(`31等弓手眼`,new BuffStat("cdR",16)),
      new Buff(`主教祝福`,new BuffStat("pmad",50),new BuffStat("bdR",10)),
      new Buff(`五轉祝福`,new BuffStat("pmad",20)),
      new Buff(`小屋BOSS`,new BuffStat("bdR",15)),
      new Buff(`回聲`,new BuffStat("pmadR",4)),
      new Buff(`狂豹咆哮`,new BuffStat("pmadR",10)),
      new Buff(`晚上的氣息`,new BuffStat("hp",1000)),
      new Buff(`武公`,new BuffStat("pmadR",100)),
      new Buff(`30等楓祝`,new BuffStat(()=>{
        return mapleBuffStat.value.ps
      },()=>{
        return mapleBuffStat.value.maple30
      })),
      new Buff(`31等楓祝`,new BuffStat(()=>{
        return mapleBuffStat.value.ps
      },()=>{
        return mapleBuffStat.value.maple31
      })),
      new Buff(`30等大楓祝`,new BuffStat(()=>{
        return mapleBuffStat.value.ps
      },()=>{
        return mapleBuffStat.value.maple30Super
      })),
      new Buff(`31等大楓祝`,new BuffStat(()=>{
        return mapleBuffStat.value.ps
      },()=>{
        return mapleBuffStat.value.maple31Super
      })),
    ]
    this.custom = []
    this.load()
  }
  save(){
    this.save_func()
  }
  add(name,key,val){
    this.custom.push(new Buff(name,new BuffStat(key,val)))
    this.save()
  }
  del(i){
    this.custom.splice(i,1)
    this.save()
  }
}

const buffs = new Buffs() //buff實例

const calcSources = ref([{name:'pmad',val:1,}]) //等效源
const statNames = ['hp','str','int','luk','dex'] //所有主副屬
const statRNames = statNames.map(n=>n+'R') //主副屬的%數
const statDNames = statNames.map(n=>n+'D') //主副屬的未受%加成數
// parseIndex()
const gis = "xs:24 s:12 m:8 l:6 xl:4 xxl:4"
// const calcStatsOptions = Object.keys(calcStats).map(k=>{return {label:props[k],value:k}})
const calcStatsOptions = computed(()=>{
  //顯示的屬性，主要用於buff加成及等效屬性計算，過濾掉非主副的屬性
  const result = []
  Object.keys(calcStats).forEach(k=>{
    const option = {label:props[k],value:k}
    if (statNames.indexOf(k)>=0){
      if (showStats.value.includes(k)) result.push(option)
    }else if (statRNames.indexOf(k)>=0 || statDNames.indexOf(k)>=0){
      if (showStats.value.includes(k.substring(0,k.length-1))) result.push(option)
    }else {
      result.push(option)
    }
  })
  return result
})
const jobOptions = jobGroups.map(item=>{
  //用於職業選擇的數據
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
  return child
})

const showStats = computed(()=>{
  //主副屬
  return statNames.filter(k=>jobs.hasOwnProperty(currentStat.value.data.job) && (jobs[currentStat.value.data.job].ps.indexOf(k)>=0 || jobs[currentStat.value.data.job].ss.indexOf(k)>=0))
})

function statLabel(s) {
  let desc = ""
  if (showStats.value.includes(s)){
    if (jobs[currentStat.value.data.job].ps.indexOf(s)>=0){
      desc = "[主屬]"
    }else if (jobs[currentStat.value.data.job].ss.indexOf(s)>=0){
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

function numToRate(num){
  let p = 1_00
  num *= p * 100
  while(num < 10){
    p *= 10
    num *= 10
  }
  return (Math.round(num) / p).toFixed(p.toFixed().length-1) + '%'
}

//計算素質
const def = ref(300)
const currentStatCalcResult = computed(()=>{
  getStore().save()
  return calcSourceData(currentStat.value.data)
})
function calcSourceAddonData(addons){
  const result = dupeObj(calcStats)
  result.diff = 0
  result.dDamage = 0
  if (!jobs.hasOwnProperty(currentStat.value.data.job)){
    return result
  }
  let changed = false
  const data = dupeObj(currentStat.value.data)
  for (let source of addons){
    if (!result.hasOwnProperty(source.name) && source.name!=='atR') continue
    changed = true
    addStat(data,source.name,source.val,false)
  }
  if (!changed){
    return result
  }

  const buffData = applyBuff(dupeObj(currentStat.value.data))
  const beforeResult = currentStatCalcResult.value
  const afterResult = calcSourceData(data)

  //計算提升攻擊（提升後的防後暴B功 - 提升前的防後暴B功）
  const diff = afterResult.defBossCriticalDamage - beforeResult.defBossCriticalDamage
  result['diff'] = diff

  if (afterResult.defBDamage===0) return result

  //計算提升%
  result.diffR = formatFloat(diff / beforeResult.defBossCriticalDamage * 100)

  //計算爆傷比例
  result.cdR = formatFloat((diff / beforeResult.defBDamage * 100))

  //計算提升的防後B功(等於b功 * 減去無視防禦後實際能打的傷害部分)
  const diffDefBDamage = diff / ( 1.35 + buffData.cdR / 100)
  //提升的無視防禦率
  result.imdR = formatFloat(((diffDefBDamage / beforeResult.bDamage) / (def.value / 100) / ( 1 - beforeResult.imdr/100) * 100))
  //b功 （等於真攻 * （1+傷害+b傷） * （1+終傷））
  const diffBDamage = diffDefBDamage / beforeResult.remainingDef
  //表功
  result.dDamage = formatFloat(Math.floor(diffBDamage / (1+buffData.damR/100+buffData.bdR/100) * (1+buffData.damR/100)))
  //傷害/b傷
  result.damR = result.bdR = formatFloat((diffBDamage / beforeResult.damage / (1+buffData.pmdR/100) * 100))
  //終傷
  result.pmdR = formatFloat((diffBDamage / beforeResult.damage / (1+buffData.damR/100+buffData.bdR/100) * 100))
  //真攻 （等於 武器係數 * 屬性 * 攻擊 / 100）
  const diffDamage = diffBDamage / (1+buffData.pmdR/100) / (1+buffData.damR/100+buffData.bdR/100)
  //便於計算的真攻 （等於 屬性 * 攻擊）
  const diffRDamage = diffDamage / beforeResult.wm * 100
  //最終攻擊
  const pmadD = diffRDamage / beforeResult.st
  result.pmadD = formatFloat(pmadD)
  result.pmad = formatFloat((pmadD / (1+buffData.pmadR/100)))
  result.pmadR = formatFloat((pmadD / buffData.pmad * 100))
  //st
  const diffSt = diffRDamage / Math.floor(buffData.pmad * (1+buffData.pmadR/100) + buffData.pmadD)
  let aSt = 0
  switch (data.job) {
    case "3122":
      result['strD'] = formatFloat(diffSt)
      result['str'] = formatFloat((diffSt / (1+buffData['strR']/100)))
      result['strR'] = formatFloat((diffSt / buffData['str'] * 100))

      result['hpD'] = formatFloat((diffSt / 0.8 * 3.5))
      result['hp'] = formatFloat((diffSt / 0.8 * 3.5 / (1+buffData['hpR']/100)))
      result['hpR'] = formatFloat((diffSt / 0.8 * 3.5 / buffData['hp'] * 100))

      aSt += buffData['str']
      break
    case "3612":
      for (const s of jobs[data.job].ps){
        result[s+'D'] = formatFloat((diffSt / 3))
        result[s] = formatFloat((diffSt / 3 / (1+buffData[s+'R']/100)))
        result[s+'R'] = formatFloat((diffSt / 3 / buffData[s] * 100))

        // diffAtSt -= (buffData[s] - buffData[s+'D']) * 3
        aSt += buffData[s] * 3
      }
      break
    default:
      for (const s of jobs[data.job].ps){
        result[s+'D'] = formatFloat((diffSt / 4))
        result[s] = formatFloat((diffSt / 4 / (1+buffData[s+'R']/100)))
        result[s+'R'] = formatFloat((diffSt / 4 / buffData[s] * 100))

        aSt += buffData[s] * 4
      }
      for (const s of jobs[data.job].ss){
        result[s+'D'] = formatFloat(diffSt)
        result[s] = formatFloat((diffSt / (1+buffData[s+'R']/100)))
        result[s+'R'] = formatFloat((diffSt / buffData[s] * 100))

        aSt += buffData[s]
      }
  }
  result['atR'] = formatFloat(diffSt / aSt * 100)

  return result
}
//計算等效屬性
const sourceStatCalcResult = computed(()=>{
  return calcSourceAddonData(calcSources.value)
})
//極限屬性

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
  let lastStat = dupeObj(currentStat.value.data)
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
  const initialResult = currentStatCalcResult.value
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
    addStat(lastStat,name,-val,false)
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
  let lastResult = calcSourceData(lastStat)
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
        const newStat = addStat(lastStat,name,val)
        //計算加點後的素質
        const addResult = calcSourceData(newStat)
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
      let newStat = dupeObj(lastStat)
      newStat.imdR = initialImdR  //更換為初始無視，因為無視需要整體運算
      for (const name in plan){
        if (name !== "point"){
          let {val} = pointAndVal(name,tempPlan[name],plan[name]) //算出增加的屬性值
          newStat = addStat(newStat,name,val,name==='imdR') //算出增加後的屬性，如果是無視時則使用複製模式，否則直接增加
        }
      }
      const newResult = calcSourceData(newStat)  //算出新的素質
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

//hexa屬性計算
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

function hexaStat(source,config,isAdd=true){
  //根據源素質計算hexa加成後的素質
  const statConfig = {
    cdR:0.35,
    bdR:1,
    imdR:1,
    damR:0.75,
    pmad:5,
  }
  if (!jobs.hasOwnProperty(source.job)){
    return source
  }
  for (const key in config){
    const item = config[key]
    let rate = key==="primary" ? item.level + Math.max(item.level-4,0) + Math.max(item.level-7,0) + Math.max(item.level-9,0) : item.level
    if (!isAdd) rate = -rate
    if (item.name==="hexaStat"){
      switch (source.job) {
        case "3122":
          addStat(source,'hpD',rate * 2100)
          break
        case "3612":
          for (const s of jobs[source.job].ps){
            addStat(source,s+'D',rate * 48)
          }
          break
        default:
          for (const s of jobs[source.job].ps){
            addStat(source,s+'D',rate * 100)
          }
      }
    }else if (statConfig.hasOwnProperty(item.name)) {
      addStat(source,item.name,rate * statConfig[item.name])
    }
  }
  return source
}
function calcHexaState() {
  calcHexaIng.value = true
  hexaStateLogs.value = ''
  if (!jobs.hasOwnProperty(currentStat.value.data.job)){
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
  if (allLv > 20){
    hexaStateLogs.value += "HEXA屬性核心總等級大於20，是否填寫錯誤？"
    calcHexaIng.value = false
    return
  }
  const sourceStat = hexaStat(dupeObj(currentStat.value.data),hexaData.value,false)
  console.table(sourceStat)
  const sourceResult = calcSourceData(sourceStat)
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
        const ts = hexaStat(dupeObj(sourceStat),cd)
        const tr = calcSourceData(ts)
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
  hexaStateLogs.value += `提升最大的組合為：主：${props[bestPn]}(${cd.primary.level}等)，副1：${props[bestSn1]}(${cd.secondary1.level}等)，副2：${props[bestSn2]}(${cd.secondary2.level}等)，防後爆B攻為${numberFormat.value(bestBCD)}，提升${numberFormat.value(bestDiff)}\n`
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
  for (const v of currentStat.value.data.imdR){
    mdr *= (100-v)/100
  }
  return 100 - mdr
})
</script>

<template>
  <n-page-header :title="currentStat.showName" @back="handleBack">
    <n-card>
      <n-tabs default-value="input" size="large" justify-content="space-evenly">
        <n-tab-pane name="input" tab="屬性設定">
          <n-form>
            <n-collapse v-model:expanded-names="inputPanelCollapseExpanded">
              <n-collapse-item title="等級、職業" name="1">
                <n-grid item-responsive responsive="screen" x-gap="12">
                  <n-form-item-gi label="備註名" :span="gis">
                    <n-input placeholder="備註名" v-model:value="currentStat.name" />
                  </n-form-item-gi>
                  <n-form-item-gi :label="props.level" :span="gis">
                    <n-input-number min="0" max="300" v-model:value="currentStat.data.level" />
                  </n-form-item-gi>
                  <n-form-item-gi :label="props.job" :span="gis">
                    <n-select
                        v-model:value="currentStat.data.job"
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
                      <n-input-number min="0" v-model:value="currentStat.data.damR">
                        <template #suffix>
                          %
                        </template>
                      </n-input-number>
                    </n-form-item-gi>
                    <n-form-item-gi :label="props.pmdR" :span="gis">
                      <n-input-number min="0" v-model:value="currentStat.data.pmdR">
                        <template #suffix>
                          %
                        </template>
                      </n-input-number>
                    </n-form-item-gi>
                    <n-form-item-gi :label="props.cdR" :span="gis">
                      <n-input-number min="0" v-model:value="currentStat.data.cdR">
                        <template #suffix>
                          %
                        </template>
                      </n-input-number>
                    </n-form-item-gi>
                    <n-form-item-gi :label="props.pmad+'基本數值'" :span="gis">
                      <n-input-number min="0" v-model:value="currentStat.data.pmad">
                      </n-input-number>
                    </n-form-item-gi>
                    <n-form-item-gi :label="props.pmadR" :span="gis">
                      <n-input-number min="0" v-model:value="currentStat.data.pmadR">
                        <template #suffix>
                          %
                        </template>
                      </n-input-number>
                    </n-form-item-gi>
                    <n-form-item-gi :label="props.pmad+'%未套用數值'" :span="gis">
                      <n-popover trigger="hover">
                        <template #trigger>
                          <n-input-number min="0" v-model:value="currentStat.data.pmadD">
                          </n-input-number>
                        </template>
                        <span>填入{{props.pmad}}%未套用數值，<br>目前只有陰陽師HP轉換等少數{{props.pmad}}不套用%加成，一般職業填0即可</span>
                      </n-popover>
                    </n-form-item-gi>
                    <n-form-item-gi :label="props.bdR" :span="gis">
                      <n-input-number min="0" v-model:value="currentStat.data.bdR">
                        <template #suffix>
                          %
                        </template>
                      </n-input-number>
                    </n-form-item-gi>
                    <n-form-item-gi :label="props.ndR" :span="gis">
                      <n-input-number min="0" v-model:value="currentStat.data.ndR">
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
                      <n-button attr-type="button" @click="currentStat.data.imdR.push(0)">
                        增加無視防禦率
                      </n-button>
                    </n-form-item-gi>
                    <template v-for="(item, index) in currentStat.data.imdR">
                      <n-form-item-gi :label="`${props.imdR}${index + 1}`" :span="gis">
                        <n-input-group>
                          <n-input-number min="0" max="100" v-model:value="currentStat.data.imdR[index]">
                            <template #suffix>
                              %
                            </template>
                          </n-input-number>
                          <n-button style="margin-left: 12px" @click="currentStat.data.imdR.splice(index, 1)">
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
                  {{formatFloat(statImdR)}}%
                </template>
              </n-collapse-item>
              <n-collapse-item title="主副屬" name="4">
                <n-space vertical>
                  <n-grid item-responsive responsive="screen" x-gap="12">
                    <template v-for="s in showStats">
                      <n-form-item-gi :label="statLabel(s) + ' 按順序填入基本數值、%數值、%未套用數值'" span="xs:24 s:24 m:24 l:12 xl:12 xxl:12">
                        <n-input-group>
                          <n-popover trigger="hover">
                            <template #trigger>
                              <n-input-number v-model:value="currentStat.data[s]" />
                            </template>
                            <span>填入ui上顯示的{{props[s]}}基本數值</span>
                          </n-popover>
                          <n-popover trigger="hover">
                            <template #trigger>
                              <n-input-number v-model:value="currentStat.data[s+'R']" :placeholder="props[s+'R']">
                                <template #suffix>
                                  %
                                </template>
                              </n-input-number>
                            </template>
                            <span>填入{{props[s+'R']}}數值</span>
                          </n-popover>
                          <n-popover trigger="hover">
                            <template #trigger>
                              <n-input-number v-model:value="currentStat.data[s+'D']" />
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
              註：角色起始屬性點為25點，等級為1等，所有屬性點最低為4點，3轉及4轉各給予5點屬性點，所以4轉後角色屬性點總數一般是(等級-1)*5+25-(非主屬個數*4)，除傑諾外4轉職業的屬性點可以視為18+5×等級（起始25點，扣除0-1等的5點，加上3、4轉10點，扣除3個非主屬共12點，即25-5+2*5-3*4=18，再加上0等開始每等5點）
              註：楓祝增加的是按手動增加到屬性值上的屬性點（ui中浮動框的[基本數值]欄下面的基本）增加屬性，一般職業4轉後計算公式可以視為(18+5×等級)*15%/16%捨去小數（你的楓祝加成或許是{{Math.floor((18+5*currentStat.data.level)*0.15)}}/{{Math.floor((18+5*currentStat.data.level)*0.16)}}）<br>
              註：大楓祝增加的是楓祝增加的屬性未捨去小數的值乘以4（你的大楓祝加成或許是{{Math.floor((18+5*currentStat.data.level)*0.15*4)}}/{{Math.floor((18+5*currentStat.data.level)*0.16*4)}}）
            </n-alert>
            <n-collapse v-model:expanded-names="buffsPanelCollapseExpanded">
              <n-collapse-item title="常用BUFF" name="1">
                <n-space vertical>
                  <template v-for="buff in buffs.default">
                    <n-checkbox
                        v-model:checked="buff.check"
                        :label="buff.getDesc(currentStat.data)"
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
                        表攻：{{numberFormat(currentStatCalcResult.dDamage)}}
                      </template>
                      <span>真攻 × (100% + 傷害%) × (100% + 總傷%)</span>
                    </n-popover>
                  </n-gi>
                  <n-gi :span="gis">
                    <n-popover trigger="hover">
                      <template #trigger>
                        真攻：{{numberFormat(currentStatCalcResult.damage)}}
                      </template>
                      <span>武器係數({{currentStat.data.job===null?'-':jobs[currentStat.data.job].wm}}) × 屬性加權({{currentStatCalcResult.st}}) × 總攻擊力({{Math.floor(currentStat.data.pmad * (1+currentStat.data.pmadR/100))}}) ÷ 100</span>
                    </n-popover>
                  </n-gi>
                  <n-gi :span="gis">
                    <n-popover trigger="hover">
                      <template #trigger>
                        B攻：{{numberFormat(currentStatCalcResult.bDamage)}}
                      </template>
                      <span>真攻 × (100% + 傷害% + B傷%) × (100% + 總傷%)</span>
                    </n-popover>
                  </n-gi>
                  <n-gi :span="gis">
                    <n-popover trigger="hover">
                      <template #trigger>
                        一般：{{numberFormat(currentStatCalcResult.nDamage)}}
                      </template>
                      <span>真攻 × (100% + 傷害% + 一般傷害%) × (100% + 總傷%)</span>
                    </n-popover>
                  </n-gi>
                  <n-gi :span="gis">
                    <n-popover trigger="hover">
                      <template #trigger>
                        無視：{{formatFloat(currentStatCalcResult.imdr)}}%
                      </template>
                      <span>計算BUFF後的無視防禦率%</span>
                    </n-popover>
                  </n-gi>
                  <n-form-item-gi label-placement="left" label="目標防禦%" :span="gis">
                    <n-input-number min="0" v-model:value="def">
                      <template #suffix>
                        %
                      </template>
                    </n-input-number>
                  </n-form-item-gi>
                  <n-gi :span="gis">
                    <n-popover trigger="hover">
                      <template #trigger>
                        防後B攻：{{numberFormat(currentStatCalcResult.defBDamage)}}
                      </template>
                      <span>無視：{{currentStatCalcResult.imdr.toFixed(2)}}%，剩餘防禦：{{(100 - currentStatCalcResult.remainingDef * 100).toFixed(2)}}%<br />B攻 × (100% - 剩餘防禦%)</span>
                    </n-popover>
                  </n-gi>
                  <n-gi :span="gis">
                    <n-popover trigger="hover">
                      <template #trigger>
                        防後暴B攻：{{numberFormat(currentStatCalcResult.defBossCriticalDamage)}}
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
                        <template #trigger>提升防後爆B攻：{{sourceStatCalcResult.diff}}</template>
                        <span>提升所有等效屬性後增加的防後爆B攻</span>
                      </n-popover>
                    </n-gi>
                    <n-gi :span="gis">
                      <n-popover trigger="hover">
                        <template #trigger>提升%：{{sourceStatCalcResult.diffR}}%</template>
                        <span>提升所有等效屬性後增加的防後爆B攻相對於未提升時的%數</span>
                      </n-popover>
                    </n-gi>
                    <n-gi :span="gis">
                      <n-popover trigger="hover">
                        <template #trigger>表攻：{{sourceStatCalcResult.dDamage}}</template>
                        <span>提升所有等效屬性後增加的表攻</span>
                      </n-popover>
                    </n-gi>
                    <template  v-for="s in showStats">
                      <n-gi :span="gis">{{props[s]}}：{{sourceStatCalcResult[s]}}</n-gi>
                      <n-gi :span="gis">{{props[s+'R']}}：{{sourceStatCalcResult[s+'R']}}%</n-gi>
                      <n-gi :span="gis">{{props[s+'D']}}：{{sourceStatCalcResult[s+'D']}}</n-gi>
                    </template>
                    <n-gi :span="gis">{{props.atR}}：{{sourceStatCalcResult.atR}}%</n-gi>
                    <n-gi :span="gis">{{props.pmad}}：{{sourceStatCalcResult.pmad}}</n-gi>
                    <n-gi :span="gis">{{props.pmadR}}：{{sourceStatCalcResult.pmadR}}%</n-gi>
                    <n-gi :span="gis">{{props.pmadD}}：{{sourceStatCalcResult.pmadD}}</n-gi>
                    <n-gi :span="gis">{{props.damR}}/{{props.bdR}}：{{sourceStatCalcResult.damR}}%</n-gi>
                    <n-gi :span="gis">{{props.imdR}}：{{sourceStatCalcResult.imdR}}%</n-gi>
                    <n-gi :span="gis">{{props.pmdR}}：{{sourceStatCalcResult.pmdR}}%</n-gi>
                    <n-gi :span="gis">{{props.cdR}}：{{sourceStatCalcResult.cdR}}%</n-gi>
                  </n-grid>
                </n-space>
              </n-collapse-item>
              <n-collapse-item title="極限屬性" name="3">
                <n-space vertical>
                  <n-alert :show-icon="false">
                    計算極限屬性時建議先將暴擊率點到100%。<br>
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
    <template #extra>
      <n-space>
        <n-button @click="getStore().save()">立即儲存</n-button>
      </n-space>
    </template>
  </n-page-header>
</template>

<style scoped>

</style>