export function debounce(func, duration=500){
    let timerId = null
    return function (...args) {
        timerId !== null && clearTimeout(timerId)
        timerId = setTimeout(()=>{
            func.apply(this,args)
        },duration)
    }
}