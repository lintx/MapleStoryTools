import {debounce} from "@/utils/debounce.js";

const ver = 3
const v1 = {
    level:0,//等級
    job:null,//職業/武器
    damR:0,//傷害
    pmdR:0,//最終傷害
    imdR:[],//無視防禦率
    cdR:0,//爆擊傷害
    pmad:0,//攻擊力/魔法攻擊力
    pmadR:0,//攻擊力%/魔法攻擊力%
    pmadD:0,//最終攻擊力/魔法攻擊力
    bdR:0,//BOSS傷害
    str:0,
    dex:0,
    int:0,
    luk:0,
    hp:0,
    strA:0,
    dexA:0,
    intA:0,
    lukA:0,
    hpA:0,
    strR:0,
    dexR:0,
    intR:0,
    lukR:0,
    hpR:0,
    strD:0,
    dexD:0,
    intD:0,
    lukD:0,
    hpD:0,
    incstr:0,
    incdex:0,
    incint:0,
    incluk:0,
    inchp:0,
}
const v2 = {
    level:0,//等級
    job:null,//職業/武器
    damR:0,//傷害
    pmdR:0,//最終傷害
    imdR:[],//無視防禦率
    cdR:0,//爆擊傷害
    pmad:0,//攻擊力/魔法攻擊力
    pmadR:0,//攻擊力%/魔法攻擊力%
    pmadD:0,//最終攻擊力/魔法攻擊力
    bdR:0,//BOSS傷害
    str:0,
    dex:0,
    int:0,
    luk:0,
    hp:0,
    strR:0,
    dexR:0,
    intR:0,
    lukR:0,
    hpR:0,
    strD:0,
    dexD:0,
    intD:0,
    lukD:0,
    hpD:0,
}
const v3 = {
    level:0,//等級
    job:null,//職業/武器
    damR:0,//傷害
    pmdR:0,//最終傷害
    imdR:[],//無視防禦率
    cdR:0,//爆擊傷害
    pmad:0,//攻擊力/魔法攻擊力
    pmadR:0,//攻擊力%/魔法攻擊力%
    pmadD:0,//最終攻擊力/魔法攻擊力
    bdR:0,//BOSS傷害
    ndR:0,
    str:0,
    dex:0,
    int:0,
    luk:0,
    hp:0,
    strR:0,
    dexR:0,
    intR:0,
    lukR:0,
    hpR:0,
    strD:0,
    dexD:0,
    intD:0,
    lukD:0,
    hpD:0,
}

const verMap = {
    1:v1,
    2:v2,
    3:v3,
}
const propNames = {
    level:"等級",
    job:"職業/武器",
    damR:"傷害",
    pmdR:"最終傷害",
    imdR:"無視防禦率",
    cdR:"爆擊傷害",
    pmad:"攻擊/魔法攻擊",
    pmadD:"攻擊/魔法攻擊%未套用",
    pmadR:"攻擊%/魔法攻擊%",
    bdR:"BOSS傷害",
    ndR:"一般傷害",
    str:"str",
    dex:"dex",
    int:"int",
    luk:"luk",
    hp:"hp",
    atR:'全屬%',
    strR:"str%",
    dexR:"dex%",
    intR:"int%",
    lukR:"luk%",
    hpR:"hp%",
    strD:"str%未套用",
    dexD:"dex%未套用",
    intD:"int%未套用",
    lukD:"luk%未套用",
    hpD:"hp%未套用",
    hexaStat:"主屬",
}
const data = v3

const jobGroups = [
    {name:"冒險家劍士",child:[1121,1122,1221,1222,132]},
    {name:"冒險家法師",child:[212,222,232]},
    {name:"冒險家弓手",child:[322,312,332]},
    {name:"冒險家盜賊",child:[412,422,434]},
    {name:"冒險家海盜",child:[512,522,532]},
    {name:"騎士團",child:[11121,11122,1212,1312,1412,1512,5112]},
    {name:"反抗軍",child:[3312,3512,3212,3712,3112,3122,3612]},
    {name:"英雄團",child:[2217,2312,2112,2712,2412,2512]},
    {name:"超新星",child:[6512,6112,6412,6312]},
    {name:"雷普族",child:[15212,15512,15112,15412]},
    {name:"阿尼瑪",child:[16412,16212]},
    {name:"曉之陣",child:[4112,4212]},
    {name:"江湖團",child:[17512,17212]},
    {name:"其他",child:[101121,101122,14212]},
]

export function getJobGroups(){
    return jobGroups
}

class BuffStat{
    constructor(key,value){
        this.key = key
        this.value = value
    }
}

class Buff{
    constructor(name,...stats) {
        this.name = name
        this.stats = stats
        this.check = false
    }
    get desc(){
        return `${this.name}：${this.stats.map(s=>`${propNames[s.key]}+${s.value}${s.key.charAt(s.key.length-1)==='R'?'%':''}`).join('，')}`
    }
}

const localBuffKey = `stat_buff_data`
class Buffs{
    load(){
        const local = localStorage.getItem(localBuffKey)
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
            localStorage.setItem(localBuffKey,JSON.stringify(arr))
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

const buffs = new Buffs()
export function getBuffs(){
    return buffs
}

const jobs = {
    1121:{name:"英雄(單手武器)",wm:1.34,ps:["str"],ss:["dex"]},
    1122:{name:"英雄(雙手武器)",wm:1.44,ps:["str"],ss:["dex"]},
    1221:{name:"聖騎士(單手武器)",wm:1.24,ps:["str"],ss:["dex"]},
    1222:{name:"聖騎士(雙手武器)",wm:1.34,ps:["str"],ss:["dex"]},
    132:{name:"黑騎士",wm:1.49,ps:["str"],ss:["dex"]},
    212:{name:"大魔導士(火、毒)",wm:1.2,ps:["int"],ss:["luk"]},
    222:{name:"大魔導士(冰、雷)",wm:1.2,ps:["int"],ss:["luk"]},
    232:{name:"主教",wm:1.2,ps:["int"],ss:["luk"]},
    322:{name:"箭神",wm:1.3,ps:["dex"],ss:["str"]},
    312:{name:"神射手",wm:1.35,ps:["dex"],ss:["str"]},
    332:{name:"開拓者",wm:1.3,ps:["dex"],ss:["str"]},
    412:{name:"夜使者",wm:1.75,ps:["luk"],ss:["dex"]},
    422:{name:"暗影神偷",wm:1.3,ps:["luk"],ss:["dex","str"]},
    434:{name:"影武者",wm:1.3,ps:["luk"],ss:["dex","str"]},
    512:{name:"拳霸",wm:1.7,ps:["str"],ss:["dex"]},
    522:{name:"槍神",wm:1.5,ps:["dex"],ss:["str"]},
    532:{name:"重砲指揮官",wm:1.5,ps:["str"],ss:["dex"]},
    11121:{name:"聖魂劍士(單手武器)",wm:1.24,ps:["str"],ss:["dex"]},
    11122:{name:"聖魂劍士(雙手武器)",wm:1.34,ps:["str"],ss:["dex"]},
    1212:{name:"烈焰巫師",wm:1.2,ps:["int"],ss:["luk"]},
    1312:{name:"破風使者",wm:1.3,ps:["dex"],ss:["str"]},
    1412:{name:"暗夜行者",wm:1.75,ps:["luk"],ss:["dex"]},
    1512:{name:"閃雷悍將",wm:1.7,ps:["str"],ss:["dex"]},
    5112:{name:"米哈逸",wm:1.24,ps:["str"],ss:["dex"]},
    3312:{name:"狂豹獵人",wm:1.35,ps:["dex"],ss:["str"]},
    3512:{name:"機甲戰神",wm:1.5,ps:["dex"],ss:["str"]},
    3212:{name:"煉獄巫師",wm:1.2,ps:["int"],ss:["luk"]},
    3712:{name:"爆拳槍神",wm:1.7,ps:["str"],ss:["dex"]},
    3112:{name:"惡魔殺手",wm:1.2,ps:["str"],ss:["dex"]},
    3122:{name:"惡魔復仇者",wm:1.3,ps:["hp"],ss:["str"]},
    3612:{name:"傑諾",wm:1.3125,ps:["str","dex","luk"],ss:[]},
    2217:{name:"龍魔導士",wm:1.2,ps:["int"],ss:["luk"]},
    2312:{name:"精靈遊俠",wm:1.3,ps:["dex"],ss:["str"]},
    2112:{name:"狂狼勇士",wm:1.49,ps:["str"],ss:["dex"]},
    2712:{name:"夜光",wm:1.3,ps:["int"],ss:["luk"]},
    2412:{name:"幻影俠盜",wm:1.3,ps:["luk"],ss:["dex"]},
    2512:{name:"隱月",wm:1.7,ps:["str"],ss:["dex"]},
    6512:{name:"天使破壞者",wm:1.7,ps:["dex"],ss:["str"]},
    6112:{name:"凱撒",wm:1.34,ps:["str"],ss:["dex"]},
    6412:{name:"卡蒂娜",wm:1.3,ps:["luk"],ss:["dex","str"]},
    6312:{name:"凱殷",wm:1.3,ps:["dex"],ss:["str"]},
    15212:{name:"伊利恩",wm:1.2,ps:["int"],ss:["luk"]},
    15512:{name:"亞克",wm:1.7,ps:["str"],ss:["dex"]},
    15112:{name:"阿戴爾",wm:1.3,ps:["str"],ss:["dex"]},
    15412:{name:"卡莉",wm:1.3,ps:["luk"],ss:["dex"]},
    101121:{name:"神之子(琉)",wm:1.49,ps:["str"],ss:["dex"]},
    101122:{name:"神之子(璃)",wm:1.34,ps:["str"],ss:["dex"]},
    14212:{name:"凱內西斯",wm:1.2,ps:["int"],ss:["luk"]},
    16412:{name:"虎影",wm:1.3,ps:["luk"],ss:["dex"]},
    16212:{name:"菈菈",wm:1.2,ps:["int"],ss:["luk"]},
    4112:{name:"劍豪",wm:1.25,ps:["str"],ss:["dex"]},
    4212:{name:"陰陽師",wm:1.35,ps:["int"],ss:["luk"]},
    17512:{name:"墨玄",wm:1.75,ps:["dex"],ss:["str"]},
    17212:{name:"琳恩",wm:1.34,ps:["int"],ss:["luk"]},
}
const calcStats = {
    damR:0,//傷害
    pmdR:0,//最終傷害
    imdR:0,//無視防禦率
    cdR:0,//爆擊傷害
    pmad:0,//攻擊力/魔法攻擊力
    pmadD:0,//最終攻擊力
    pmadR:0,//攻擊力%/魔法攻擊力%
    bdR:0,//BOSS傷害
    str:0,
    dex:0,
    int:0,
    luk:0,
    hp:0,
    atR:0,
    strR:0,
    dexR:0,
    intR:0,
    lukR:0,
    hpR:0,
    strD:0,
    dexD:0,
    intD:0,
    lukD:0,
    hpD:0,
}

export function getCalcStats(){
    return calcStats
}

function dupeObj(obj) {
    let add = {}
    Object.keys(obj).forEach(k=>{
        if (Array.isArray(obj[k])){
            add[k] = []
            for (const e of obj[k]){
                add[k].push(e)
            }
        }else {
            add[k] = obj[k]
        }
    })
    return add
}

export function importData(str){
    let arr = str.split(",")
    let v = Number(arr.shift())
    if (!(v in verMap)){
        return null
    }
    const vd = verMap[v]
    let rd = {}
    Object.keys(vd).sort().forEach((k,i)=>{
        if (k==="job"){
            if (jobs.hasOwnProperty(arr[i])){
                rd[k] = arr[i]
            }else {
                rd[k] = null
            }
        }else if (Array.isArray(vd[k])){
            const _arr = arr[i].split("-")
            const r = []
            for (const v of _arr){
                const val = Number(v)
                if (!isNaN(val)) r.push(val)
            }
            rd[k] = r
        }else if (typeof vd[k] === "number"){
            rd[k]=Number(arr[i])
            if (isNaN(rd[k])) rd[k] = 0
        }else {
            return null
        }
    })
    let result = {}
    Object.keys(data).forEach(k=>{
        if (k in rd){
            result[k] = rd[k]
        }else{
            result[k] = data[k]
        }
    })
    return result
}
export function exportData(d) {
    let arr = Object.keys(d).sort().map(k=>{
        if (k==="job"){
            if (jobs.hasOwnProperty(d[k])){
                return d[k]
            }else {
                return ""
            }
        }else if (Array.isArray(d[k])){
            return d[k].join("-")
        }else if (typeof d[k] === "number"){
            return d[k]
        }else {
            return d[k]
        }
    })
    arr.unshift(ver)
    return arr.join(",")
}

export function formatFloat(val){
    if (typeof val!=="number") return val
    if (!Number.isFinite(val)) return "∞"
    return Math.round(val * 10000) / 10000
}

class Stat {
    data
    def = 300
    calcStat = dupeObj(calcStats)
    calcSources = [{
        name:"pmad",
        val:1,
    }]
    constructor(data,name = "") {
        // this.data = ref(data)
        this.data = data
        this.name = name
        // console.log(this.data)
    }
    showName(){
        return computed(()=>{
            // console.log(this.data)
            let title = `${this.data.level}等${this.data.job===null?`無職業`:jobs[this.data.job]["name"]}`
            if (this.name!=="") title = `${this.name}(${title})`
            return title
        })
    }
    calcData(){
        return computed(()=>{
            return this.calcNewData(this.data)
        })
    }
    calcNewData(data){
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
        if (!jobs.hasOwnProperty(this.data.job)){
            return result
        }
        data = this.buffStat(data)

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
        result.remainingDef = 1 - ( 1 - result.imdr/100) * this.def/100

        //計算防後B功
        result.defBDamage = Math.max(Math.floor(result.bDamage * result.remainingDef),0)

        //計算防後暴B功
        result.defBossCriticalDamage = Math.floor(result.defBDamage * ( 1.35 + data.cdR / 100))

        return result
    }
    buffStat(data){
        data = dupeObj(data)
        //計算buff
        for (const buff of buffs.default){
            if (buff.check){
                for (const ss of buff.stats){
                    this.addStat(data,ss.key,ss.value,false)
                }
            }
        }
        for (const buff of buffs.custom){
            if (buff.check){
                for (const ss of buff.stats){
                    this.addStat(data,ss.key,ss.value,false)
                }
            }
        }
        return data
    }
    addStat(source,name,val,dupe=true){
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
                    // data[san] = ((source[san] - source[san+"D"]) / (1+source[san+"R"]/100)) * (1+(source[san+'R'] + val)/100) + source[san+'D']
                    data[san+'R'] += val
                }
                break
            default:
                if (data.hasOwnProperty(name)) data[name] += val
        }
        return data
    }
    hexaStat(source,config,isAdd=true){
        const statConfig = {
            cdR:0.35,
            bdR:1,
            imdR:1,
            damR:0.75,
            pmad:5,
        }
        let result = this.data
        if (!jobs.hasOwnProperty(this.data.job)){
            return result
        }
        for (const key in config){
            const item = config[key]
            let rate = key==="primary" ? item.level + Math.max(item.level-4,0) + Math.max(item.level-7,0) + Math.max(item.level-9,0) : item.level
            if (!isAdd) rate = -rate
            if (item.name==="hexaStat"){
                switch (this.data.job) {
                    case "3122":
                        result = this.addStat(result,'hpD',rate * 2100)
                        break
                    case "3612":
                        for (const s of jobs[this.data.job].ps){
                            result = this.addStat(result,s+'D',rate * 48)
                        }
                        break
                    default:
                        for (const s of jobs[this.data.job].ps){
                            result = this.addStat(result,s+'D',rate * 100)
                        }
                }
            // }else if (item.name==='imdR' && !isAdd){
            //     //扣除無視防禦時，應這樣扣除
            //     //(100-i)/100*(100-y)/100=1,(100-i)*(100-y)=10000,100-y=10000/(100-i),y=100-10000/(100-i)
            //     let mdr = -rate * statConfig[item.name]
            //     mdr = 100-10000/(100-mdr)
            //     result = this.addStat(result,item.name,mdr)
            }else if (statConfig.hasOwnProperty(item.name)) {
                result = this.addStat(result,item.name,rate * statConfig[item.name])
            }
        }
        return result
    }
    calcSourceResult(){
        return computed(()=>{
            const result = dupeObj(calcStats)
            result.diff = 0
            result.dDamage = 0
            if (!jobs.hasOwnProperty(this.data.job)){
                return result
            }
            let changed = false
            const data = dupeObj(this.data)
            for (let source of this.calcSources){
                if (!result.hasOwnProperty(source.name) && source.name!=='atR') continue
                changed = true
                this.addStat(data,source.name,source.val,false)
            }
            if (!changed){
                return result
            }

            const buffData = this.buffStat(this.data)
            const beforeResult = this.calcNewData(this.data)
            const afterResult = this.calcNewData(data)

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
            result.imdR = formatFloat(((diffDefBDamage / beforeResult.bDamage) / (this.def / 100) / ( 1 - beforeResult.imdr/100) * 100))
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
        })
    }
}

const localKey = `stat_calc_data`
class Store{
    #stats = [];
    #save = debounce(()=>{
        const arr = []
        for (const s of this.#stats){
            let str = exportData(s.data)
            arr.push(s.name===""?str:{name:s.name,value:str})
        }
        localStorage.setItem(localKey,JSON.stringify(arr))
    })
    constructor() {
        this.load()
    }
    load(){
        const local = localStorage.getItem(localKey)
        try {
            const j = JSON.parse(local)
            if (Array.isArray(j)){
                for (const i of j){
                    let str = i
                    let name = ""
                    if (typeof i==="object"){
                        str = i.value
                        name = i.name
                    }
                    const d = importData(str)
                    if (d!==null){
                        this.#stats.push(new Stat(d,name))
                    }
                }
            }
        }catch (e) {

        }finally {
            if (this.#stats.length===0) this.add()
        }
    }
    save(){
        this.#save()
    }
    add(){
        this.#stats.push(new Stat(dupeObj(data)))
        this.save()
        return this.#stats.length - 1
    }
    stats(){
        return this.#stats
    }
    newStat(data){
        return new Stat(data)
    }
}

const store = new Store()
export function getStore(){
    return store
}

export function getPropNames() {
    return propNames
}

export function getJobs(){
    return jobs
}