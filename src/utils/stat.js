import {debounce} from "@/utils/debounce.js";

const ver = 1
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

const verMap = {
    1:v1,
}
const propNames = {
    level:"等級",
    job:"職業/武器",
    damR:"傷害",
    pmdR:"最終傷害",
    imdR:"無視防禦率",
    cdR:"爆擊傷害",
    pmad:"攻擊力/魔法攻擊力",
    pmadD:"最終攻擊力/魔法攻擊力",
    pmadR:"攻擊力%/魔法攻擊力%",
    bdR:"BOSS傷害",
    str:"str",
    dex:"dex",
    int:"int",
    luk:"luk",
    hp:"hp",
    strA:"吃藥後str",
    dexA:"吃藥後dex",
    intA:"吃藥後int",
    lukA:"吃藥後luk",
    hpA:"吃藥後hp",
    strR:"str%",
    dexR:"dex%",
    intR:"int%",
    lukR:"luk%",
    hpR:"hp%",
    strD:"最終str",
    dexD:"最終dex",
    intD:"最終int",
    lukD:"最終luk",
    hpD:"最終hp",
    incstr:"吃藥增加str",
    incdex:"吃藥增加dex",
    incint:"吃藥增加int",
    incluk:"吃藥增加luk",
    inchp:"吃藥增加hp",
}
const data = v1

const jobs = {
    1121:{name:"英雄(單手武器)",wm:1.3,ps:["str"],ss:["dex"]},
    1122:{name:"英雄(雙手武器)",wm:1.44,ps:["str"],ss:["dex"]},
    1221:{name:"聖騎士(單手武器)",wm:1.2,ps:["str"],ss:["dex"]},
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
    11121:{name:"聖魂劍士(單手武器)",wm:1.2,ps:["str"],ss:["dex"]},
    11122:{name:"聖魂劍士(雙手武器)",wm:1.34,ps:["str"],ss:["dex"]},
    1212:{name:"烈焰巫師",wm:1.2,ps:["int"],ss:["luk"]},
    1312:{name:"破風使者",wm:1.3,ps:["dex"],ss:["str"]},
    1412:{name:"暗夜行者",wm:1.75,ps:["luk"],ss:["dex"]},
    1512:{name:"閃雷悍將",wm:1.7,ps:["str"],ss:["dex"]},
    5112:{name:"米哈逸",wm:1.2,ps:["str"],ss:["dex"]},
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
    101121:{name:"神之子(琉)",wm:1.49,ps:["str"],ss:["dex"]},
    101122:{name:"神之子(璃)",wm:1.34,ps:["str"],ss:["dex"]},
    14212:{name:"凱內西斯",wm:1.2,ps:["int"],ss:["luk"]},
    16412:{name:"虎影",wm:1.3,ps:["luk"],ss:["dex"]},
    16212:{name:"菈菈",wm:1.2,ps:["int"],ss:["luk"]},
    4112:{name:"劍豪",wm:1.25,ps:["str"],ss:["dex"]},
    4212:{name:"陰陽師",wm:1.35,ps:["int"],ss:["luk"]},
    17512:{name:"墨玄",wm:1.75,ps:["dex"],ss:["str"]},
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
        }else {
            add[k] = obj[k]
        }
    })
    return add
}

export function importData(str){
    let arr = str.split(",")
    let v = parseInt(arr.shift())
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
                const val = parseInt(v)
                if (!isNaN(val)) r.push(val)
            }
            rd[k] = r
        }else if (typeof vd[k] === "number"){
            rd[k]=parseInt(arr[i])
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


class Stat {
    data
    def = 300
    calcStat = dupeObj(calcStats)
    calcSource = {
        name:"pmad",
        val:1,
    }
    constructor(data) {
        // this.data = ref(data)
        this.data = data
        // console.log(this.data)
    }
    showName(){
        return computed(()=>{
            // console.log(this.data)
            return `${this.data.level}等${this.data.job===null?`無職業`:jobs[this.data.job]["name"]}`
        })
    }
    calcImdr(){
        return computed(()=>{
            let val = 100
            for (const v of this.data.imdR){
                val *= (100-v)/100
            }
            return 100-val
        })
    }
    statWeight(){
        return computed(()=>{
            if (!jobs.hasOwnProperty(this.data.job)){
                return "請選擇職業"
            }
            let st = 0//屬性
            switch (this.data.job) {
                case "3122":
                    let chp = 545 + 90 * this.data.level
                    st = Math.floor(chp / 3.5) + 0.8 * Math.floor((this.data.hp - chp) / 3.5) + this.data.str
                    break
                case "3612":
                    st = (this.data.str + this.data.luk + this.data.dex) * 3
                    break
                default:
                    for (const s of jobs[this.data.job].ps){
                        st += this.data[s] * 4
                    }
                    for (const s of jobs[this.data.job].ss){
                        st += this.data[s]
                    }
            }
            return st
        })
    }
    realDamage(){
        return computed(()=>{
            if (!jobs.hasOwnProperty(this.data.job)){
                return "請選擇職業"
            }
            const wm = jobs[this.data.job].wm
            let st = this.statWeight().value
            if (typeof st==="string") return st
            return Math.floor(wm * st * Math.floor(this.data.pmad * (1+this.data.pmadR/100) + data.pmadD) / 100)
        })
    }
    displayDamage(){
        return computed(()=>{
            if (!jobs.hasOwnProperty(this.data.job)){
                return "請選擇職業"
            }
            const damage = this.realDamage().value
            if (typeof damage==="string") return damage
            return Math.floor(damage * (1+this.data.damR/100) * (1+this.data.pmdR/100))
        })
    }
    bossDamage(){
        return computed(()=>{
            if (!jobs.hasOwnProperty(this.data.job)){
                return "請選擇職業"
            }
            const damage = this.realDamage().value
            if (typeof damage==="string") return damage
            return Math.floor(damage * (1+this.data.damR/100+this.data.bdR/100) * (1+this.data.pmdR/100))
        })
    }
    remainingDef(){
        return computed(()=>{
            return 1 - ( 1 - this.calcImdr().value/100) * this.def/100
        })
    }
    defBossDamage(){
        return computed(()=>{
            if (!jobs.hasOwnProperty(this.data.job)){
                return "請選擇職業"
            }
            const damage = this.bossDamage().value
            if (typeof damage==="string") return damage
            const result = Math.floor(damage * this.remainingDef().value)
            return Math.max(result,0)
        })
    }
    defBossCriticalDamage(){
        return computed(()=>{
            if (!jobs.hasOwnProperty(this.data.job)){
                return "請選擇職業"
            }
            const damage = this.defBossDamage().value
            if (typeof damage==="string") return damage
            return Math.floor(damage * ( 1.5 + this.data.cdR / 100))
        })
    }
    calcSourceResult(){
        return computed(()=>{
            const data = dupeObj(this.data)
            for (const v of this.data.imdR){
                data.imdR.push(v)
            }
            const result = dupeObj(calcStats)
            if (!jobs.hasOwnProperty(this.data.job)){
                return result
            }
            if (!result.hasOwnProperty(this.calcSource.name)){
                return result
            }
            switch (this.calcSource.name) {
                case "imdR":
                    data[this.calcSource.name].push(this.calcSource.val)
                    break
                case "hp":
                case "str":
                case "int":
                case "luk":
                case "dex":
                    data[this.calcSource.name] = ((this.data[this.calcSource.name] - this.data[this.calcSource.name+"D"]) / (1+this.data[this.calcSource.name+"R"]/100) + this.calcSource.val) * (1+this.data[this.calcSource.name+'R']/100) + this.data[this.calcSource.name+'D']
                    break
                case "hpR":
                case "strR":
                case "intR":
                case "lukR":
                case "dexR":
                    let sn = this.calcSource.name.substring(0,this.calcSource.name.length-1)
                    data[sn] = ((this.data[sn] - this.data[sn+"D"]) / (1+this.data[sn+"R"]/100)) * (1+(this.data[sn+'R'] + this.calcSource.val)/100) + this.data[sn+'D']
                    break
                default:
                    data[this.calcSource.name] += this.calcSource.val
            }

            //計算加權後的無視
            let imdr = 100
            for (const v of data.imdR){
                imdr *= (100-v)/100
            }
            imdr = 100 - imdr

            //計算加權後的屬性
            let st = 0
            switch (data.job) {
                case "3122":
                    let chp = 545 + 90 * data.level
                    st = Math.floor(chp / 3.5) + 0.8 * Math.floor((data.hp - chp) / 3.5) + data.str
                    break
                case "3612":
                    st = (data.str + data.luk + data.dex) * 3
                    break
                default:
                    for (const s of jobs[data.job].ps){
                        st += data[s] * 4
                    }
                    for (const s of jobs[data.job].ss){
                        st += data[s]
                    }
            }

            //計算加權後的真功
            const wm = jobs[data.job].wm
            const damage = Math.floor(wm * st * Math.floor(data.pmad * (1+data.pmadR/100) + data.pmadD) / 100)

            //加權後的b功
            const bDamage = Math.floor(damage * (1+data.damR/100+data.bdR/100) * (1+data.pmdR/100))

            //加權後防禦後有效傷害部分
            const remainingDef = 1 - ( 1 - imdr/100) * this.def/100

            //計算加權後的防後B功
            const defBDamage = Math.max(Math.floor(bDamage * remainingDef),0)

            //計算加權後的防後暴B功
            const defBossCriticalDamage = Math.floor(defBDamage * ( 1.5 + data.cdR / 100))

            //計算提升攻擊（提升後的防後暴B功 - 提升前的防後暴B功）
            const diff = defBossCriticalDamage - this.defBossCriticalDamage().value

            if (defBDamage===0) return result
            //計算爆傷比例
            result.cdR = (diff / defBDamage * 100).toFixed(4)

            //計算提升的防後B功(等於b功 * 減去無視防禦後實際能打的傷害部分)
            const diffDefBDamage = diff / ( 1.5 + data.cdR / 100)
            //提升的無視防禦率
            result.imdR = ((diffDefBDamage / bDamage) / (this.def / 100) / ( 1 - this.calcImdr().value/100) * 100).toFixed(4)
            //b功 （等於真攻 * （1+傷害+b傷） * （1+終傷））
            const diffBDamage = diffDefBDamage / remainingDef
            //傷害/b傷
            result.damR = result.bdR = (diffBDamage / damage / (1+data.pmdR/100) * 100).toFixed(4)
            //終傷
            result.pmdR = (diffBDamage / damage / (1+data.damR/100+data.bdR/100) * 100).toFixed(4)
            //真攻 （等於 武器係數 * 屬性 * 攻擊 / 100）
            const diffDamage = diffBDamage / (1+data.pmdR/100) / (1+data.damR/100+data.bdR/100)
            //便於計算的真攻 （等於 屬性 * 攻擊）
            const diffRDamage = diffDamage / wm * 100
            //最終攻擊
            const pmadD = diffRDamage / st
            result.pmadD = pmadD.toFixed(4)
            result.pmad = (pmadD / (1+data.pmadR/100)).toFixed(4)
            result.pmadR = (pmadD / data.pmad * 100).toFixed(4)
            //st
            const diffSt = diffRDamage / Math.floor(data.pmad * (1+data.pmadR/100) + data.pmadD)
            switch (data.job) {
                case "3122":
                    result['strD'] = diffSt.toFixed(4)
                    result['str'] = (diffSt / (1+data['strR']/100)).toFixed(4)
                    result['strR'] = (diffSt / (data['str'] - data['strD']) * 100).toFixed(4)

                    result['hpD'] = (diffSt / 0.8 * 3.5).toFixed(4)
                    result['hp'] = (diffSt / 0.8 * 3.5 / (1+data['hpR']/100)).toFixed(4)
                    result['hpR'] = (diffSt / 0.8 * 3.5 / (data['hp'] - data['hpD']) * 100).toFixed(4)
                    break
                case "3612":
                    for (const s of jobs[data.job].ps){
                        result[s+'D'] = (diffSt / 3).toFixed(4)
                        result[s] = (diffSt / 3 / (1+data[s+'R']/100)).toFixed(4)
                        result[s+'R'] = (diffSt / 3 / (data[s] - data[s+'D']) * 100).toFixed(4)
                    }
                    break
                default:
                    for (const s of jobs[data.job].ps){
                        result[s+'D'] = (diffSt / 4).toFixed(4)
                        result[s] = (diffSt / 4 / (1+data[s+'R']/100)).toFixed(4)
                        result[s+'R'] = (diffSt / 4 / (data[s] - data[s+'D']) * 100).toFixed(4)
                    }
                    for (const s of jobs[data.job].ss){
                        result[s+'D'] = diffSt.toFixed(4)
                        result[s] = (diffSt / (1+data[s+'R']/100)).toFixed(4)
                        result[s+'R'] = (diffSt / (data[s] - data[s+'D']) * 100).toFixed(4)
                    }
            }

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
            arr.push(exportData(s.data))
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
                    const d = importData(i)
                    if (d!==null){
                        this.#stats.push(new Stat(d))
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