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
    pmad:"攻擊/魔法攻擊",
    pmadD:"最終攻擊/魔法攻擊",
    pmadR:"攻擊%/魔法攻擊%",
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
    atR:'全屬%',
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
    hexaStat:"主屬",
}
const data = v1

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

function formatFloat(val){
    if (typeof val!=="number") return val
    if (!Number.isFinite(val)) return "∞"
    return Math.round(val * 10000) / 10000
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
            dDamage:0,  //表功
            remainingDef:0, //有效傷害比
            defBDamage:0,   //有效b功
            defBossCriticalDamage:0,    //有效爆功
        }
        if (!jobs.hasOwnProperty(this.data.job)){
            return result
        }

        //計算無視
        let mdr = 100
        for (const v of data.imdR){
            mdr *= (100-v)/100
        }
        result.imdr = 100 - mdr

        //計算屬性
        switch (data.job) {
            case "3122":
                let chp = 545 + 90 * data.level
                result.st = Math.floor(chp / 3.5) + 0.8 * Math.floor((data.hp - chp) / 3.5) + data.str
                break
            case "3612":
                result.st = (data.str + data.luk + data.dex) * 3
                break
            default:
                for (const s of jobs[data.job].ps){
                    result.st += data[s] * 4
                }
                for (const s of jobs[data.job].ss){
                    result.st += data[s]
                }
        }

        //計算真功
        result.wm = jobs[data.job].wm
        result.damage = Math.floor(result.wm * result.st * Math.floor(data.pmad * (1+data.pmadR/100) + data.pmadD) / 100)

        //表功
        result.dDamage = Math.floor(result.damage * (1+data.damR/100) * (1+data.pmdR/100))

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
    addStat(source,name,val){
        const data = dupeObj(source)
        for (const v of source.imdR){
            data.imdR.push(v)
        }
        switch (name) {
            case "imdR":
                if (val < 0){
                    //扣除無視防禦時，應這樣扣除
                    //(100-i)/100*(100-y)/100=1,(100-i)*(100-y)=10000,100-y=10000/(100-i),y=100-10000/(100-i)
                    data[name].push(100-10000/(100+val))
                }else {
                    data[name].push(val)
                }
                break
            case "hp":
            case "str":
            case "int":
            case "luk":
            case "dex":
                data[name] = ((source[name] - source[name+"D"]) / (1+source[name+"R"]/100) + val) * (1+source[name+'R']/100) + source[name+'D']
                break
            case "hpD":
            case "strD":
            case "intD":
            case "lukD":
            case "dexD":
                let sdn = name.substring(0,name.length-1)
                data[sdn] += val
                break
            case "hpR":
            case "strR":
            case "intR":
            case "lukR":
            case "dexR":
                let sn = name.substring(0,name.length-1)
                data[sn] = ((source[sn] - source[sn+"D"]) / (1+source[sn+"R"]/100)) * (1+(source[sn+'R'] + val)/100) + source[sn+'D']
                break
            case "atR":
                for (const san of ['str','int','luk','dex']){
                    data[san] = ((source[san] - source[san+"D"]) / (1+source[san+"R"]/100)) * (1+(source[san+'R'] + val)/100) + source[san+'D']
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
            if (!result.hasOwnProperty(this.calcSource.name) && this.calcSource.name!=='atR'){
                return result
            }

            const data = this.addStat(this.data,this.calcSource.name,this.calcSource.val)
            const beforeResult = this.calcNewData(this.data)
            const afterResult = this.calcNewData(data)

            //計算提升攻擊（提升後的防後暴B功 - 提升前的防後暴B功）
            const diff = afterResult.defBossCriticalDamage - beforeResult.defBossCriticalDamage
            result['diff'] = diff

            if (afterResult.defBDamage===0) return result
            //計算爆傷比例
            result.cdR = formatFloat((diff / beforeResult.defBDamage * 100))

            //計算提升的防後B功(等於b功 * 減去無視防禦後實際能打的傷害部分)
            const diffDefBDamage = diff / ( 1.35 + this.data.cdR / 100)
            //提升的無視防禦率
            result.imdR = formatFloat(((diffDefBDamage / beforeResult.bDamage) / (this.def / 100) / ( 1 - beforeResult.imdr/100) * 100))
            //b功 （等於真攻 * （1+傷害+b傷） * （1+終傷））
            const diffBDamage = diffDefBDamage / beforeResult.remainingDef
            //表功
            result.dDamage = formatFloat(Math.floor(diffBDamage / (1+this.data.damR/100+this.data.bdR/100) * (1+this.data.damR/100)))
            //傷害/b傷
            result.damR = result.bdR = formatFloat((diffBDamage / beforeResult.damage / (1+this.data.pmdR/100) * 100))
            //終傷
            result.pmdR = formatFloat((diffBDamage / beforeResult.damage / (1+this.data.damR/100+this.data.bdR/100) * 100))
            //真攻 （等於 武器係數 * 屬性 * 攻擊 / 100）
            const diffDamage = diffBDamage / (1+this.data.pmdR/100) / (1+this.data.damR/100+this.data.bdR/100)
            //便於計算的真攻 （等於 屬性 * 攻擊）
            const diffRDamage = diffDamage / beforeResult.wm * 100
            //最終攻擊
            const pmadD = diffRDamage / beforeResult.st
            result.pmadD = formatFloat(pmadD)
            result.pmad = formatFloat((pmadD / (1+this.data.pmadR/100)))
            result.pmadR = formatFloat((pmadD / this.data.pmad * 100))
            //st
            const diffSt = diffRDamage / Math.floor(this.data.pmad * (1+this.data.pmadR/100) + this.data.pmadD)
            let aSt = 0
            switch (data.job) {
                case "3122":
                    result['strD'] = formatFloat(diffSt)
                    result['str'] = formatFloat((diffSt / (1+this.data['strR']/100)))
                    result['strR'] = formatFloat((diffSt / ((this.data['str'] - this.data['strD']) / (1 + this.data['strR']/100)) * 100))

                    result['hpD'] = formatFloat((diffSt / 0.8 * 3.5))
                    result['hp'] = formatFloat((diffSt / 0.8 * 3.5 / (1+this.data['hpR']/100)))
                    result['hpR'] = formatFloat((diffSt / 0.8 * 3.5 / ((this.data['hp'] - this.data['hpD']) / (1 + this.data['hpR']/100)) * 100))

                    aSt += (this.data['str'] - this.data['strD']) / (1 + this.data['strR']/100)
                    break
                case "3612":
                    for (const s of jobs[data.job].ps){
                        result[s+'D'] = formatFloat((diffSt / 3))
                        result[s] = formatFloat((diffSt / 3 / (1+this.data[s+'R']/100)))
                        result[s+'R'] = formatFloat((diffSt / 3 / ((this.data[s] - this.data[s+'D']) / (1 + this.data[s+'R']/100)) * 100))

                        // diffAtSt -= (this.data[s] - this.data[s+'D']) * 3
                        aSt += (this.data[s] - this.data[s+'D']) / (1 + this.data[s+'R']/100) * 3
                    }
                    break
                default:
                    for (const s of jobs[data.job].ps){
                        result[s+'D'] = formatFloat((diffSt / 4))
                        result[s] = formatFloat((diffSt / 4 / (1+this.data[s+'R']/100)))
                        result[s+'R'] = formatFloat((diffSt / 4 / ((this.data[s] - this.data[s+'D']) / (1 + this.data[s+'R']/100)) * 100))

                        aSt += (this.data[s] - this.data[s+'D']) / (1 + this.data[s+'R']/100) * 4
                    }
                    for (const s of jobs[data.job].ss){
                        result[s+'D'] = formatFloat(diffSt)
                        result[s] = formatFloat((diffSt / (1+this.data[s+'R']/100)))
                        result[s+'R'] = formatFloat((diffSt / ((this.data[s] - this.data[s+'D']) / (1 + this.data[s+'R']/100)) * 100))

                        aSt += (this.data[s] - this.data[s+'D']) / (1 + this.data[s+'R']/100)
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