import {createRouter,createWebHashHistory} from 'vue-router'
// import Index from '@/components/Index.vue'
// import StatCalcIndex from '@/components/stat_calc/StatCalcIndex.vue'
// import StatCalc from '@/components/stat_calc/StatCalc.vue'
// import bonusCalc from '@/components/bonus_stats/Calc.vue'
// import Todo from "@/components/todo/Todo.vue";
import {loadRouter} from "vite-vue-auto-load-router";

// const index = Index
// const calcIndex = StatCalcIndex
// const calc = StatCalc

// const routes = [
//     { path: '/', component: index },
//     { path: '/stat-calc', component: calcIndex },
//     { path: '/stat-calc/import/:importData', component: calcIndex },
//     { path: '/stat-calc/:index', component: calc },
//     { path: '/bonus-calc', component: bonusCalc },
//     { path: '/todo', component: Todo },
// ]

const pages = import.meta.glob('@/pages/**/**.vue',{eager:true,import:"default"})

// console.log(pages)

const routes = loadRouter(pages)

// console.log(routes)

const router = createRouter({
    history: createWebHashHistory(),
    routes,
})

export function useRouter(){
    return router
}