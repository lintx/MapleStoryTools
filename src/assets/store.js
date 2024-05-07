import {darkTheme, useOsTheme} from "naive-ui";

const osThemeRef = useOsTheme();
const localTheme = localStorage.getItem("tools_theme")
let tn = 'dark'
if (localTheme!==null && (localTheme==='dark' || localTheme==='light')){
    tn = localTheme
}else if (osThemeRef.value === "dark"){
    tn = 'dark'
}else {
    tn = 'light'
}
const themeName = ref(  tn)
const theme = computed(() => {
    const { value } = themeName
    return value === 'dark' ? darkTheme : null
})
export function useThemeName() {
    return themeName
}
export function useTheme() {
    return theme
}