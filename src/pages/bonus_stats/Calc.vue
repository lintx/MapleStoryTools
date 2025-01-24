<script setup>

import {Calculation} from "@vicons/carbon";

defineOptions({
  route:{
    meta:{
      icon:Calculation,
      title:'星火計算機',
      desc: '計算裝備星火素質',
      sort:2,
    },
    path:"/bonus-calc",
  }
})

function formatFloat(val){
  if (typeof val!=="number") return val
  if (!Number.isFinite(val)) return "∞"
  return (val * 100) + '%'
}

class BonusItem{
  static TypeNormal = 0
  static TypeWakeup = 1
  t1 = "-"
  t2 = "-"
  t3 = "-"
  t4 = "-"
  t5 = "-"
  name = ""
  type = BonusItem.TypeNormal
  constructor(name,type,t1,t2,t3,t4,t5) {
    this.name = name
    this.type = type
    this.t1 = t1
    this.t2 = t2
    this.t3 = t3
    this.t4 = t4
    this.t5 = t5
  }

  values(){
    return [this.t1,this.t2,this.t3,this.t4,this.t5]
  }
}

const BonusItems = [
    new BonusItem("110～150級輪迴星火",BonusItem.TypeNormal,"60%","35%","5%","",""),
    new BonusItem("強力的輪迴星火",BonusItem.TypeNormal,"50%","30%","20%","",""),
    new BonusItem("永遠的輪迴星火",BonusItem.TypeNormal,"44.44%","33.33%","22.22%","",""),
    new BonusItem("覺醒的輪迴星火",BonusItem.TypeWakeup,"97.36%","1.50%","0.58%","0.33%","0.23%"),
]

class EquipType{
  static All = 0
  static Normal = 1
  static Boss = 2
  static Weapons = 3
  static NormalWeapons = 4
  static BossWeapons = 5
}
class Tier{
  static LevelName = ["T1","T2","T3","T4","T5","T6","T7"];
  t1 = 0
  t2 = 0
  t3 = 0
  t4 = 0
  t5 = 0
  t6 = 0
  t7 = 0
  minLevel = 0
  maxLevel = 0
  constructor(min, max, t1, t2, t3, t4, t5, t6, t7) {
    this.minLevel = min
    this.maxLevel = max
    this.t1 = t1
    this.t2 = t2
    this.t3 = t3
    this.t4 = t4
    this.t5 = t5
    this.t6 = t6
    this.t7 = t7
  }

  values(){
    return [this.t1, this.t2, this.t3, this.t4, this.t5, this.t6, this.t7]
  }

  origin(calc){
    if (!calc){
      return this.values()
    }else {
      return this.values().map(val=>formatFloat(val))
    }
  }

  value(calc,attack=0){
    if (!calc){
      return this.values()
    }else {
      return this.values().map(val=>Math.ceil(val * attack))
    }
  }
}

class Stat{
  static normal = new Tier(0,999,0,0,0,0,0,0,0)
  name = ``
  tiers = []
  type = EquipType.All
  calc = false
  constructor(name,type,tiers,calc=false){
    this.type = type
    this.name = name
    this.tiers = tiers
    this.calc = calc
  }

  tier(level){
    for(const t of this.tiers){
      if (level >= t.minLevel && level <= t.maxLevel){
        return t
      }
    }
    return Stat.normal
  }

  origin(level){
    return this.tier(level).origin(this.calc)
  }

  value(level,attack){
    return this.tier(level).value(this.calc,attack)
  }
}
const stats = [
    new Stat(`單屬`,EquipType.All,[
        new Tier(0,19,1,2,3,4,5,6,7),
        new Tier(20,39,2,4,6,8,10,12,14),
        new Tier(40,59,3,6,9,12,15,18,21),
        new Tier(60,79,4,8,12,16,20,24,28),
        new Tier(80,99,5,10,15,20,25,30,35),
        new Tier(100,119,6,12,18,24,30,36,42),
        new Tier(120,139,7,14,21,28,35,42,49),
        new Tier(140,159,8,16,24,32,40,48,56),
        new Tier(160,179,9,18,27,36,45,54,63),
        new Tier(180,199,10,20,30,40,50,60,70),
        new Tier(200,229,11,22,33,44,55,66,77),
        new Tier(230,999,12,24,36,48,60,72,84),
    ]),
    new Stat(`雙屬`,EquipType.All,[
        new Tier(0,39,1,2,3,4,5,6,7),
        new Tier(40,79,2,4,6,8,10,12,14),
        new Tier(80,119,3,6,9,12,15,18,21),
        new Tier(120,159,4,8,12,16,20,24,28),
        new Tier(160,199,5,10,15,20,25,30,35),
        new Tier(200,249,6,12,18,24,30,36,42),
        new Tier(250,999,7,14,21,28,35,42,49),
    ]),
    new Stat(`HP`,EquipType.All,[
        new Tier(0,9,3,6,9,12,15,18,21),
        new Tier(10,19,30,60,90,120,150,180,210),
        new Tier(20,29,60,120,180,240,300,360,420),
        new Tier(30,39,90,180,270,360,450,540,630),
        new Tier(40,49,120,240,360,480,600,720,840),
        new Tier(50,59,150,300,450,600,750,900,1050),
        new Tier(60,69,180,360,540,720,900,1080,1260),
        new Tier(70,79,210,420,630,840,1050,1260,1470),
        new Tier(80,89,240,480,720,960,1200,1440,1680),
        new Tier(90,99,270,540,810,1080,1350,1620,1890),
        new Tier(100,109,300,600,900,1200,1500,1800,2100),
        new Tier(110,119,330,660,990,1320,1650,1980,2310),
        new Tier(120,129,360,720,1080,1440,1800,2160,2520),
        new Tier(130,139,390,780,1170,1560,1950,2340,2730),
        new Tier(140,149,420,840,1260,1680,2100,2520,2940),
        new Tier(150,159,450,900,1350,1800,2250,2700,3150),
        new Tier(160,169,480,960,1440,1920,2400,2880,3360),
        new Tier(170,179,510,1020,1530,2040,2550,3060,3570),
        new Tier(180,189,540,1080,1620,2160,2700,3240,3780),
        new Tier(190,199,570,1140,1710,2280,2850,3420,3990),
        new Tier(200,209,600,1200,1800,2400,3000,3600,4200),
        new Tier(210,219,620,1240,1860,2480,3100,3720,4340),
        new Tier(220,229,640,1280,1920,2560,3200,3840,4480),
        new Tier(230,239,660,1320,1980,2640,3300,3960,4620),
        new Tier(240,249,680,1360,2040,2720,3400,4080,4760),
        new Tier(250,999,700,1400,2100,2800,3500,4200,4900),
    ]),
    new Stat(`全屬`,EquipType.All,[
        new Tier(0,275,"1%","2%","3%","4%","5%","6%","7%"),
    ]),
    new Stat(`防攻`,EquipType.Normal,[
        new Tier(0,275,1,2,3,4,5,6,7),
    ]),
    new Stat(`傷害`,EquipType.Weapons,[
        new Tier(0,275,"1%","2%","3%","4%","5%","6%","7%"),
    ]),
    new Stat(`BOSS`,EquipType.Weapons,[
        new Tier(0,275,"2%","4%","6%","8%","10%","12%","14%"),
    ]),
    new Stat(`武攻`,EquipType.NormalWeapons,[
        new Tier(0,39,0.01,0.022,0.0363,0.0524,0.073205,0.087846,0.102487),
        new Tier(40,79,0.02,0.044,0.0726,0.10648,0.14641,0.175692,0.204974),
        new Tier(80,119,0.03,0.066,0.1089,0.15972,0.219615,0.263538,0.307461),
        new Tier(120,159,0.04,0.088,0.1452,0.21296,0.29282,0.351384,0.409948),
        new Tier(160,199,0.05,0.11,0.1815,0.2662,0.366025,0.43923,0.512435),
        new Tier(200,999,0.06,0.132,0.2178,0.31944,0.43923,0.527076,0.614922),
    ],true),
    new Stat(`武攻`,EquipType.BossWeapons,[
      new Tier(0,39,0.01,0.02,0.03,0.044,0.0605,0.07986,0.102487),
      new Tier(40,79,0.02,0.04,0.06,0.088,0.121,0.15972,0.204974),
      new Tier(80,119,0.03,0.06,0.09,0.132,0.1815,0.23958,0.307461),
      new Tier(120,159,0.04,0.08,0.12,0.176,0.242,0.31944,0.409948),
      new Tier(160,199,0.05,0.1,0.15,0.22,0.3025,0.3993,0.512435),
      new Tier(200,999,0.06,0.12,0.18,0.264,0.363,0.47916,0.614922),
    ],true),
]
const input = ref({
  level:200,
  type:EquipType.Normal,
  attack:0,
  bonus:0,
})
const available = computed(() => {
  return stats.filter(item => {
    if (item.type===EquipType.All) return true
    if (item.type===EquipType.Weapons && (input.value.type===EquipType.NormalWeapons || input.value.type===EquipType.BossWeapons)) return true
    if (item.type===EquipType.Normal && input.value.type===EquipType.Boss) return true
    return input.value.type===item.type
  })
})
const startBonusLevel = computed(() => {
  let start = 0
  const et = input.value.type
  const bi = BonusItems[input.value.bonus]
  if (bi.type===BonusItem.TypeWakeup) {
    if (et===EquipType.Boss || et===EquipType.BossWeapons) {
      start = 2
    }
  }
  return start
})
const endBonusLevel = computed(() => {
  let end = 2
  const et = input.value.type
  const bi = BonusItems[input.value.bonus]
  if (bi.type===BonusItem.TypeWakeup) {
    end = 4
    if (et===EquipType.Boss || et===EquipType.BossWeapons) {
      end = 6
    }
  }
  return end
})
const probability = computed(() => {
  const bi = BonusItems[input.value.bonus]
  const et = input.value.type
  const startLevel = startBonusLevel.value
  const endLevel = endBonusLevel.value
  const result = []
  for (let i=0;i<startLevel;i++){
    result.push("")
  }
  result.push(...bi.values())
  if (result.length<7){
    for (let i=0,l=result.length;i<7-l;i++){
      result.push("")
    }
  }
  return result
})
const resultStat = ref({
  stat:0,
  hp:0,
  attack:0,
})
const calcResult = computed(()=>{
  const ava = available.value
  const stat = resultStat.value
  const startLevel = startBonusLevel.value
  const endLevel = endBonusLevel.value
  const avaMain = []
  const avaSub = []
  const avaHp = []
  const result = {
    "單屬":"T0",
    "雙屬1":"T0",
    "雙屬2":"T0",
    "雙屬3":"T0",
    "HP":"T0",
  }
  const otherResult = []
  for (const val of ava) {
    if (val.name==="武攻"){
      result[val.name] = "T0"
      let bestIndex = -1,minDiff = -1,bestAtt = -1
      for (const [index,v] of val.value(input.value.level,input.value.attack).entries()){
        if (index > endLevel || index < startLevel) continue
        const diff = Math.abs(v-stat.attack)
        if (minDiff===-1 || diff<minDiff){
          bestIndex = index
          minDiff = diff
          bestAtt = v
        }
      }
      if (bestIndex >= 0){
        if (bestAtt===stat.attack){
          result[val.name] = Tier.LevelName[bestIndex]
        }else {
          result[val.name] = `${Tier.LevelName[bestIndex]}(${bestAtt})`
        }
      }
    }
    if (val.name==="單屬") {
      avaMain.push(...val.value(input.value.level,input.value.attack))
      avaMain.push(0)
    }
    if (val.name==="雙屬") {
      avaSub.push(...val.value(input.value.level,input.value.attack))
      avaSub.push(0)
    }
    if (val.name==="HP") avaHp.push(...val.value(input.value.level,input.value.attack))
  }

  if (stat.stat > 0){
    let bestTmp = []
    let bestMIndex = -1,bestS1Index = -1,bestS2Index = -1,bestS3Index = -1,minDiff = -1,bestMStat = -1,bestS1Stat = -1,bestS2Stat = -1,bestS3Stat = -1
    for (let [mIndex,mV] of avaMain.entries()){
      if (mV===0) mIndex=-1
      if (mIndex > endLevel || (mIndex !== -1 && mIndex < startLevel)) continue

      for (let [sIndex3,sV3] of avaSub.entries()){
        if (sV3===0) sIndex3=-1
        if (sIndex3 > endLevel || (sIndex3 !== -1 && sIndex3 < startLevel)) continue

        for (let [sIndex2,sV2] of avaSub.entries()){
          if (sV2===0) sIndex2=-1
          if (sIndex2 > endLevel || (sIndex2 !== -1 && sIndex2 < startLevel)) continue

          for (let [sIndex1,sV1] of avaSub.entries()){
            if (sV1===0) sIndex1=-1
            if (sIndex1 > endLevel || (sIndex1 !== -1 && sIndex1 < startLevel)) continue

            const diff = Math.abs(stat.stat - mV - sV1 - sV2 - sV3)
            if (diff===0){
              // let tmp = [mIndex>=0?mIndex:-1,[sIndex1,sIndex2,sIndex3].filter(a=>a>=0).sort((a,b)=>b-a)]
              let tmp = [mIndex>=0?mIndex:-1,[sIndex1,sIndex2,sIndex3].sort((a,b)=>b-a)]
              if (!bestTmp.some(v=>`${v[0]},${v[1].join(',')}`===`${tmp[0]},${tmp[1].join(',')}`)){
                bestTmp.push(tmp)
              }
            }
            if ((mIndex >= 0 || sIndex1 >= 0 || sIndex2 >= 0 || sIndex3 >= 0) && (minDiff===-1 || diff<minDiff)){
              bestMIndex = mIndex
              bestS1Index = sIndex1
              bestS2Index = sIndex2
              bestS3Index = sIndex3
              minDiff = diff
              bestMStat = mV
              bestS1Stat = sV1
              bestS2Stat = sV2
              bestS3Stat = sV3
            }
          }
        }
      }
    }

    if (bestTmp.length===0){
      if (bestMIndex >= 0){
        result["單屬"] = `${Tier.LevelName[bestMIndex]}(${bestMStat})`
      }
      if (bestS1Index >= 0){
        result["雙屬1"] = `${Tier.LevelName[bestS1Index]}(${bestS1Stat})`
      }
      if (bestS2Index >= 0){
        result["雙屬2"] = `${Tier.LevelName[bestS2Index]}(${bestS2Stat})`
      }
      if (bestS3Index >= 0){
        result["雙屬3"] = `${Tier.LevelName[bestS3Index]}(${bestS3Stat})`
      }
    }else {
      bestTmp = bestTmp.sort((a,b)=> {
        if (a[0]!==b[0]) return b[0]-a[0]
        for (let i=0;i<a[1].length;i++){
          if (a[1][i] !== b[1][i]) return b[1][i] - a[1][i]
        }
        return 0
      })
      let tmp = bestTmp.splice(0,1)[0]
      if (tmp[0] >= 0){
        result["單屬"] = Tier.LevelName[tmp[0]]
      }
      if (tmp[1][0] >= 0){
        result["雙屬1"] = Tier.LevelName[tmp[1][0]]
      }
      if (tmp[1][1] >= 0){
        result["雙屬2"] = Tier.LevelName[tmp[1][1]]
      }
      if (tmp[1][2] >= 0){
        result["雙屬3"] = Tier.LevelName[tmp[1][2]]
      }
      if (bestTmp.length > 0){
        for (const [m,[s1,s2,s3]] of bestTmp){
          const o = {}
          if (m >= 0){
            o["單屬"] = Tier.LevelName[m]
          }
          if (s1 >= 0){
            o["雙屬1"] = Tier.LevelName[s1]
          }
          if (s2 >= 0){
            o["雙屬2"] = Tier.LevelName[s2]
          }
          if (s3 >= 0){
            o["雙屬3"] = Tier.LevelName[s3]
          }
          otherResult.push(o)
        }
      }
    }
  }
  if (stat.hp > 0){
    let bestIndex = -1,minDiff = -1,bestHP = -1
    for (const [index,v] of avaHp.entries()){
      const diff = Math.abs(v-stat.hp)
      if (minDiff===-1 || diff<minDiff){
        bestIndex = index
        minDiff = diff
        bestHP = v
      }
    }
    if (bestIndex >= 0){
      if (bestHP===stat.hp){
        result["HP"] = Tier.LevelName[bestIndex]
      }else {
        result["HP"] = `${Tier.LevelName[bestIndex]}(${bestHP})`
      }
    }
  }

  for (const key in result){
    if (result[key]==="T0"){
      delete result[key]
    }
  }
  return {result,otherResult}
})
</script>

<template>
  <n-space vertical>
    <n-card :style="{maxWidth: '640px',margin: '0 auto',}" title="基礎設定">
      <n-form label-placement="left" label-width="auto" require-mark-placement="right-hanging">
        <n-form-item label="裝備等級" path="inputValue">
          <n-input-number v-model:value="input.level" placeholder="裝備等級" />
        </n-form-item>
        <n-form-item label="裝備類型" feedback="常見的BOSS裝備主要有：深淵、航海師、神秘、永恆、創世，神之子創世屬於普通武器" path="radioGroupValue">
          <n-radio-group v-model:value="input.type" name="type-radio-group">
            <n-space>
              <n-radio :value="EquipType.Normal">
                普通裝備
              </n-radio>
              <n-radio :value="EquipType.Boss">
                BOSS防、飾
              </n-radio>
              <n-radio :value="EquipType.NormalWeapons">
                普通武器
              </n-radio>
              <n-radio :value="EquipType.BossWeapons">
                BOSS武器
              </n-radio>
            </n-space>
          </n-radio-group>
        </n-form-item>
        <n-form-item label="星火類型" path="radioGroupValue">
          <n-radio-group v-model:value="input.bonus" name="bonus-radio-group">
            <n-space>
              <n-radio v-for="(b,index) in BonusItems" :value="index">{{b.name}}</n-radio>
            </n-space>
          </n-radio-group>
        </n-form-item>
        <n-form-item v-show="input.type===EquipType.NormalWeapons || input.type===EquipType.BossWeapons" label="武器攻擊" feedback="武器原始攻擊力，魔攻職業填入魔攻" path="inputValue">
          <n-input-number v-model:value="input.attack" placeholder="武器攻擊" />
        </n-form-item>
      </n-form>
    </n-card>
    <n-card :style="{maxWidth: '640px',margin: '0 auto',}" title="可用素質">
      <n-table striped size="small">
        <thead>
        <tr>
          <th></th>
          <th v-for="item in Tier.LevelName">{{item}}</th>
        </tr>
        </thead>
        <tbody>
        <tr>
          <td>幾率</td>
          <td v-for="val in probability">{{val}}</td>
        </tr>
        <tr v-for="stat in available">
          <td>{{stat.name}}</td>
          <td v-for="val in stat.value(input.level,input.attack)">{{val}}</td>
        </tr>
        </tbody>
      </n-table>
    </n-card>
    <n-card :style="{maxWidth: '640px',margin: '0 auto',}" title="星火素質">
      <n-form label-placement="left" label-width="auto" require-mark-placement="right-hanging">
        <n-form-item label="主屬" path="inputValue">
          <n-input-number v-model:value="resultStat.stat" placeholder="主屬" />
        </n-form-item>
        <n-form-item v-show="input.type===EquipType.NormalWeapons || input.type===EquipType.BossWeapons" label="攻擊" feedback="" path="inputValue">
          <n-input-number v-model:value="resultStat.attack" placeholder="攻擊" />
        </n-form-item>
        <n-form-item label="HP" path="inputValue">
          <n-input-number v-model:value="resultStat.hp" placeholder="HP" />
        </n-form-item>
      </n-form>
    </n-card>

    <n-card :style="{maxWidth: '640px',margin: '0 auto',}" title="素質回算">
      <n-space vertical>
        <n-table striped size="small">
          <thead>
          <tr>
            <th>加權</th>
            <th>等級</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(v,k) in calcResult.result">
            <td>{{k}}</td>
            <td>{{v}}</td>
          </tr>
          </tbody>
        </n-table>
        <template v-if="calcResult.otherResult.length>0">
          <n-thing>其它可能的屬性組合</n-thing>
          <n-table striped size="small" v-for="r in calcResult.otherResult">
            <thead>
            <tr>
              <th>加權</th>
              <th>等級</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(v,k) in r">
              <td>{{k}}</td>
              <td>{{v}}</td>
            </tr>
            </tbody>
          </n-table>
        </template>
      </n-space>
    </n-card>
  </n-space>
</template>

<style scoped>

</style>