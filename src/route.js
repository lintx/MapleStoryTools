import {createRouter,createWebHashHistory} from 'vue-router'
import Index from '@/components/Index.vue'
import StatCalcIndex from '@/components/stat_calc/StatCalcIndex.vue'
import StatCalc from '@/components/stat_calc/StatCalc.vue'
import bonusCalc from '@/components/bonus_stats/Calc.vue'

const index = Index
const calcIndex = StatCalcIndex
const calc = StatCalc

const routes = [
    { path: '/', component: index },
    { path: '/stat-calc', component: calcIndex },
    { path: '/stat-calc/import/:importData', component: calcIndex },
    { path: '/stat-calc/:index', component: calc },
    { path: '/bonus-calc', component: bonusCalc },
]

const router = createRouter({
    // 4. 内部提供了 history 模式的实现。为了简单起见，我们在这里使用 hash 模式。
    history: createWebHashHistory(),
    routes, // `routes: routes` 的缩写
})

export function useRouter(){
    return router
}