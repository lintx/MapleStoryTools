import {darkTheme, useOsTheme} from "naive-ui";

const osThemeRef = useOsTheme();
const themeName = ref( osThemeRef.value === "dark" ? 'dark' : 'light')
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