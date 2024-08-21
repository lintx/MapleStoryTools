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

export function newSourceData(){
    return dupeObj(data)
}

export function getPropNames(){
    return propNames
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

export function getJobs(){
    return {
        jobGroups,jobs
    }
}


export class Stat {
    data
    name
    constructor(data,name = "") {
        this.data = data
        this.name = name
    }
    get showName(){
        let title = `${this.data.level}等${this.data.job===null?`無職業`:jobs[this.data.job]["name"]}`
        if (this.name!=="") title = `${this.name}(${title})`
        return title
    }

    get exportData (){
        let arr = Object.keys(this.data).sort().map(k=>{
            if (k==="job"){
                if (jobs.hasOwnProperty(this.data[k])){
                    return this.data[k]
                }else {
                    return ""
                }
            }else if (Array.isArray(this.data[k])){
                return this.data[k].join("-")
            }else if (typeof this.data[k] === "number"){
                return this.data[k]
            }else {
                return this.data[k]
            }
        })
        arr.unshift(ver)
        return arr.join(",")
    }

    static import(name,str){
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
        return new Stat(result,name)
    }
}

const localKey = `stat_calc_data`
class Store{
    stats = reactive([])
    #save = debounce(()=>{
        const arr = []
        for (const s of this.stats){
            let str = s.exportData
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
                    const s = Stat.import(name,str)
                    if (s!==null){
                        this.stats.push(s)
                    }
                }
            }
        }catch (e) {

        }finally {
            if (this.stats.length===0) this.add()
        }
    }
    save(){
        this.#save()
    }
    add(){
        this.stats.push(new Stat(dupeObj(data)))
        this.save()
        return this.stats.length - 1
    }
    // newStat(data){
    //     return new Stat(data)
    // }
    // config = reactive({
    //     index:-1
    // })
}

const store = new Store()




export function dupeObj(obj) {
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

export function formatFloat(val){
    if (typeof val!=="number") return val
    if (!Number.isFinite(val)) return "∞"
    return Math.round(val * 10000) / 10000
}

export function getStore(){
    return store
}
